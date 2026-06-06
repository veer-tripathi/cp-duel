const Room = require('../models/Room');

// POST /api/rooms/create
const createRoom = async (req, res) => {
  try {
    const user = req.user;

    const room = await Room.create({
      host: user._id,
      players: [{
        user: user._id,
        username: user.username,
        codeforcesHandle: user.codeforcesHandle,
        rating: user.rating,
      }],
      status: 'waiting',
    });

    res.status(201).json({ room });
  } catch (err) {
    console.error('createRoom error:', err);
    res.status(500).json({ message: 'Failed to create room' });
  }
};

// POST /api/rooms/join
const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    const user = req.user;

    if (!roomId) return res.status(400).json({ message: 'roomId is required' });

    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.status !== 'waiting') return res.status(400).json({ message: 'Room is not open for joining' });
    if (room.players.length >= 2) return res.status(400).json({ message: 'Room is full' });

    // Check if user is already in room
    const alreadyIn = room.players.some((p) => String(p.user) === String(user._id));
    if (alreadyIn) return res.json({ room }); // idempotent

    room.players.push({
      user: user._id,
      username: user.username,
      codeforcesHandle: user.codeforcesHandle,
      rating: user.rating,
    });
    room.status = 'ready';
    await room.save();

    res.json({ room });
  } catch (err) {
    console.error('joinRoom error:', err);
    res.status(500).json({ message: 'Failed to join room' });
  }
};

// GET /api/rooms/:id
const getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.id });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json({ room });
  } catch (err) {
    console.error('getRoom error:', err);
    res.status(500).json({ message: 'Failed to get room' });
  }
};

module.exports = { createRoom, joinRoom, getRoom };
