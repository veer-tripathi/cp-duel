const { Server } = require('socket.io');
const { setIO } = require('../controllers/duelController');
const { stopPolling } = require('../services/pollingService');

// In-memory map of socket -> roomId (for cleanup on disconnect)
const socketRoomMap = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Important for Render (WebSocket behind proxy)
    transports: ['websocket', 'polling'],
  });

  // Give the duelController a reference to io
  setIO(io);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    /**
     * createRoom event
     * Client emits after creating room via REST API
     * { roomId, username }
     */
    socket.on('createRoom', ({ roomId, username }) => {
      socket.join(roomId);
      socketRoomMap.set(socket.id, roomId);
      console.log(`${username} created and joined socket room ${roomId}`);
    });

    /**
     * joinRoom event
     * { roomId, username, players } — players array from updated Room doc
     */
    socket.on('joinRoom', ({ roomId, username, players }) => {
      socket.join(roomId);
      socketRoomMap.set(socket.id, roomId);
      console.log(`${username} joined socket room ${roomId}`);

      // Notify everyone in the room that a new player joined
      io.to(roomId).emit('playerJoined', { players, roomId });
    });

    /**
     * startGame event
     * Host triggers this; actual logic runs through REST /api/duel/start
     * This event is informational — confirms the start request was sent
     */
    socket.on('startGame', ({ roomId }) => {
      io.to(roomId).emit('gameStarting', { roomId });
    });

    /**
     * leaveRoom event
     * Player explicitly leaves
     */
    socket.on('leaveRoom', ({ roomId, username }) => {
      socket.leave(roomId);
      socketRoomMap.delete(socket.id);
      io.to(roomId).emit('playerLeft', { username });
    });

    /**
     * On disconnect — clean up room membership
     */
    socket.on('disconnect', () => {
      const roomId = socketRoomMap.get(socket.id);
      if (roomId) {
        socketRoomMap.delete(socket.id);
        // If nobody left in socket room, room is effectively empty
        // Polling will eventually timeout or the room stays in DB
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = { initSocket };
