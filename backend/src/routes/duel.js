const express = require('express');
const router = express.Router();
const { startDuel, getDuelStatus } = require('../controllers/duelController');
const authMiddleware = require('../middleware/auth');

router.post('/start', authMiddleware, startDuel);
router.get('/status/:roomId', authMiddleware, getDuelStatus);

module.exports = router;
