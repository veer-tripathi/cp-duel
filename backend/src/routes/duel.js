const express = require('express');
const router = express.Router();
const { startDuel, getDuelStatus } = require('../controllers/duelController');
const authMiddleware = require('../middleware/auth');
const { duelStartLimiter } = require('../middleware/rateLimit');

router.post('/start', authMiddleware, duelStartLimiter, startDuel);
router.get('/status/:roomId', authMiddleware, getDuelStatus);

module.exports = router;
