const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, getRoom, getHistory } = require('../controllers/roomController');
const authMiddleware = require('../middleware/auth');

router.post('/create', authMiddleware, createRoom);
router.post('/join', authMiddleware, joinRoom);
router.get('/history', authMiddleware, getHistory);  // add this — must be before /:id
router.get('/:id', authMiddleware, getRoom);

module.exports = router;