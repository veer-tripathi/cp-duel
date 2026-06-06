const Room = require('../models/Room');
const { selectProblem } = require('../services/codeforcesService');
const { startPolling } = require('../services/pollingService');

// Shared io reference (set via setIO)
let _io = null;
const setIO = (io) => { _io = io; };

// POST /api/duel/start
const startDuel = async (req, res) => {
  try {
    const { roomId } = req.body;
    const user = req.user;

    if (!roomId) return res.status(400).json({ message: 'roomId required' });

    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Only the host can start
    if (String(room.host) !== String(user._id)) {
      return res.status(403).json({ message: 'Only the host can start the duel' });
    }
    if (room.players.length < 2) {
      return res.status(400).json({ message: 'Need 2 players to start' });
    }
    if (room.status === 'ongoing') {
      return res.status(400).json({ message: 'Duel already in progress' });
    }

    // Calculate average rating of the two players
    const avgRating = Math.round(
      room.players.reduce((sum, p) => sum + (p.rating || 1200), 0) / room.players.length
    );

    // Select a Codeforces problem
    const [p1, p2] = room.players;
    const problem = await selectProblem(p1.codeforcesHandle, p2.codeforcesHandle, avgRating);

    const startedAt = new Date();
    room.currentProblem = problem;
    room.status = 'ongoing';
    room.startedAt = startedAt;
    await room.save();

    // Notify all players in socket room
    if (_io) {
      _io.to(roomId).emit('duelStarted', { problem, startedAt });
    }

    // Begin polling for submissions
    const playersForPolling = room.players.map((p) => ({
      userId: p.user,
      username: p.username,
      codeforcesHandle: p.codeforcesHandle,
    }));
    startPolling(roomId, problem, playersForPolling, _io, startedAt);

    res.json({ problem, startedAt });
  } catch (err) {
    console.error('startDuel error:', err);
    res.status(500).json({ message: err.message || 'Failed to start duel' });
  }
};

// GET /api/duel/status/:roomId
const getDuelStatus = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    res.json({
      status: room.status,
      currentProblem: room.currentProblem,
      winner: room.winnerUsername,
      winnerSubmissionTime: room.winnerSubmissionTime,
      startedAt: room.startedAt,
      finishedAt: room.finishedAt,
    });
  } catch (err) {
    console.error('getDuelStatus error:', err);
    res.status(500).json({ message: 'Failed to get duel status' });
  }
};

module.exports = { startDuel, getDuelStatus, setIO };
