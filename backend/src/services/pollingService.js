const { getRecentSubmissions } = require('./codeforcesService');
const Room = require('../models/Room');
const User = require('../models/User');

// Active polling intervals: roomId -> intervalId
const activePolls = new Map();

/**
 * Start polling both players' submissions for a given room.
 * Emits 'gameResult' via socket when winner is found.
 *
 * @param {string} roomId - The room's roomId string
 * @param {object} problem - { contestId, index }
 * @param {Array} players - [{ userId, username, codeforcesHandle }, ...]
 * @param {object} io - Socket.IO server instance
 * @param {Date} startedAt - When the duel started (to filter stale submissions)
 */
const startPolling = (roomId, problem, players, io, startedAt) => {
  if (activePolls.has(roomId)) {
    console.log(`Poll already running for room ${roomId}`);
    return;
  }

  const POLL_INTERVAL = 6000; // 6 seconds

  const intervalId = setInterval(async () => {
    try {
      // Check each player's recent submissions in parallel
      const checks = players.map(async (player) => {
        const subs = await getRecentSubmissions(player.codeforcesHandle, 15);
        for (const sub of subs) {
          // Only look at submissions after the duel started
          const subTime = new Date(sub.creationTimeSeconds * 1000);
          if (subTime < startedAt) continue;

          if (
            sub.verdict === 'OK' &&
            sub.problem.contestId === problem.contestId &&
            sub.problem.index === problem.index
          ) {
            return { player, submission: sub, subTime };
          }
        }
        return null;
      });

      const results = await Promise.all(checks);
      const winner = results.find((r) => r !== null);

      if (winner) {
        stopPolling(roomId);
        await handleWinner(roomId, winner, io);
      }
    } catch (err) {
      console.error(`Polling error for room ${roomId}:`, err.message);
    }
  }, POLL_INTERVAL);

  activePolls.set(roomId, intervalId);
  console.log(`Started polling for room ${roomId}`);
};

// Stop polling for a room
const stopPolling = (roomId) => {
  if (activePolls.has(roomId)) {
    clearInterval(activePolls.get(roomId));
    activePolls.delete(roomId);
    console.log(`Stopped polling for room ${roomId}`);
  }
};

// Handle winner: update DB, emit socket event
const handleWinner = async (roomId, { player, subTime }, io) => {
  try {
    const room = await Room.findOneAndUpdate(
      { roomId, status: 'ongoing' },
      {
        status: 'finished',
        winner: player.userId,
        winnerUsername: player.username,
        winnerSubmissionTime: subTime,
        finishedAt: new Date(),
      },
      { new: true }
    );

    if (!room) return; // Already finished

    // Update stats
    await User.findByIdAndUpdate(player.userId, { $inc: { wins: 1 } });
    for (const p of room.players) {
      if (String(p.user) !== String(player.userId)) {
        await User.findByIdAndUpdate(p.user, { $inc: { losses: 1 } });
      }
    }

    // Emit result to all players in the room
    io.to(roomId).emit('gameResult', {
      winner: player.username,
      winnerHandle: player.codeforcesHandle,
      submissionTime: subTime,
      problem: room.currentProblem,
    });

    console.log(`Winner found for room ${roomId}: ${player.username}`);
  } catch (err) {
    console.error('handleWinner error:', err.message);
  }
};

module.exports = { startPolling, stopPolling };
