const ChatModel = require("../models/chatModel");
const MessageModel = require("../models/messageModel");
const UserModel = require("../models/userModel");
const { success, error } = require("../utils/response");
const axios = require("axios"); // <-- YOU FORGOT THIS IMPORT

class ChatController {

  // --------------------------------------------------
  // SAVE MESSAGE (user or bot/admin)
  // --------------------------------------------------
  static async saveMessage(req, res, next) {
    try {
      const { userId, senderId, messageText, senderRole } = req.body;

      if (!userId || !messageText) {
        return res
          .status(400)
          .json(error("Missing required fields: userId, messageText", "VALIDATION_ERROR"));
      }

      const userIdInt = parseInt(userId, 10);
      if (isNaN(userIdInt)) {
        return res
          .status(400)
          .json(error("Invalid userId: must be a number", "VALIDATION_ERROR"));
      }

      // Get or create chat for this user
      const chat = await ChatModel.getOrCreateChat(userIdInt);

      // Determine sender
      let actualSenderId = senderId ? parseInt(senderId, 10) : null;

      // If senderId is missing or invalid → find bot/admin
      if (!actualSenderId || actualSenderId === 0 || isNaN(actualSenderId)) {
        if (senderRole === "bot" || senderRole === "admin") {
          const fallbackUser = await UserModel.getByRole(senderRole);
          if (!fallbackUser) {
            return res.status(400).json(error(`No ${senderRole} user found`, "NOT_FOUND"));
          }
          actualSenderId = fallbackUser.id;
        } else {
          return res
            .status(400)
            .json(error("Invalid senderId or senderRole", "VALIDATION_ERROR"));
        }
      }

      // Save message
      const message = await MessageModel.createMessage(
        chat.id,
        actualSenderId,
        messageText
      );

      return res.status(201).json(success("Message saved successfully", message));
    } catch (err) {
      console.error("Error saving message:", err);
      return next({
        status: 500,
        code: "INTERNAL_ERROR",
        message: "Error saving message",
      });
    }
  }

  // --------------------------------------------------
// GET ALL USERS WHO HAVE CHATS (FOR ADMIN SIDEBAR)
// --------------------------------------------------
static async getAllChatUsers(req, res, next) {
  try {
    const users = await ChatModel.getAllUsersWithChats();

    return res.status(200).json(
      success("Users with chats retrieved successfully", users)
    );
  } catch (err) {
    console.error("Error fetching chat users:", err);
    return next({
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Error retrieving chat users",
    });
  }
}


static async proxyWebhook(req, res) {
  try {
    const { message, userId } = req.query;

    if (!message) {
      return res.status(400).json(error("Message is required", "VALIDATION_ERROR"));
    }

    let params = { message };

    // ONLY add userId if valid
    if (userId !== undefined && userId !== "" && !isNaN(parseInt(userId))) {
      params.userId = parseInt(userId, 10);
    }

    const webhookResponse = await axios.get(
      "https://n8n.quicktoolbox.in/webhook/on",
      { params }
    );

    return res.json({
      success: true,
      data: webhookResponse.data
    });

  } catch (err) {
    console.error("Webhook proxy error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}



  // --------------------------------------------------
  // GET CHAT HISTORY
  // --------------------------------------------------
  static async getChatHistory(req, res, next) {
    try {
      const { userId } = req.params;

      if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json(error("Invalid userId", "VALIDATION_ERROR"));
      }

      const userIdInt = parseInt(userId, 10);
      const chat = await ChatModel.getOrCreateChat(userIdInt);
      const messages = await MessageModel.getMessagesByChatId(chat.id);

      return res.status(200).json(
        success("Chat history retrieved successfully", {
          chatId: chat.id,
          userId: chat.user_id,
          messages,
        })
      );
    } catch (err) {
      console.error("Error getting chat history:", err);
      return next({
        status: 500,
        code: "INTERNAL_ERROR",
        message: "Error retrieving chat history",
      });
    }
  }

  // Get messages by userId (for your GET /messages/:userId route)
  static async getMessagesByUserId(req, res, next) {
    try {
      const { userId } = req.params;

      if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json(error("Invalid userId", "VALIDATION_ERROR"));
      }

      const userIdInt = parseInt(userId, 10);
      const chat = await ChatModel.getOrCreateChat(userIdInt);
      const messages = await MessageModel.getMessagesByChatId(chat.id);

      return res.status(200).json(
        success("Messages retrieved successfully", {
          chatId: chat.id,
          userId: chat.user_id,
          messages,
        })
      );
    } catch (err) {
      console.error("Error fetching messages:", err);
      return next({
        status: 500,
        code: "INTERNAL_ERROR",
        message: "Error retrieving messages",
      });
    }
  }
}





module.exports = ChatController;
