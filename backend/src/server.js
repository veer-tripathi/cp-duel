require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const duelRoutes = require('./routes/duel');

const app = express();
const server = http.createServer(app);

// Trust the first reverse proxy in production hosting environments.
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// CORS - allow frontend origin
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed for: ' + origin));
  },
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/duel', duelRoutes);

// Init Socket.IO (passes server + app for shared state)
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
