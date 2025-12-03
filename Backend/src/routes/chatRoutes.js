// routes/chatRoutes.js
const express = require('express');
const ChatController = require('../controllers/chatController');
const router = express.Router();

router.get("/users", ChatController.getAllChatUsers);  
router.get('/messages/:userId', ChatController.getMessagesByUserId); // Must be before /:userId
router.post('/messages', ChatController.saveMessage);
router.get('/webhook', ChatController.proxyWebhook);
router.get('/:userId', ChatController.getChatHistory); // Last route

module.exports = router;
