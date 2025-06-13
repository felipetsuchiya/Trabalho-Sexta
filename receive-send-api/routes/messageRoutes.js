
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.post('/', messageController.sendMessage);           // POST /message
router.post('/worker', messageController.processMessages); // POST /message/worker
router.get('/', messageController.getMessages);            // GET /message

module.exports = router;
