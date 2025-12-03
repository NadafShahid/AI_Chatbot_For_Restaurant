const { client } = require('../config/database');

class ChatModel {

  


  // Create a new chat session for a user
  static async createChat(userId) {
    const query = `
      INSERT INTO chats (user_id)
      VALUES ($1)
      RETURNING id, user_id, created_at
    `;
    const result = await client.query(query, [userId]);
    return result.rows[0];
  }

  // Get messages for a specific chat

   static async getMessagesByUserId(req, res, next) {
  try {
    const { userId } = req.params;

    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json(error("Invalid userId", "VALIDATION_ERROR"));
    }

    const userIdInt = parseInt(userId, 10);

    // Get the chat for the user
    const chat = await ChatModel.getOrCreateChat(userIdInt);

    // Get messages for this chat
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









  // Get existing chat for user or return null
  static async getChatByUserId(userId) {
    const query = `
      SELECT id, user_id, created_at
      FROM chats
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await client.query(query, [userId]);
    return result.rows[0] || null;
  }

  static async getAllUsersWithChats() {
  const query = `
    SELECT u.id, u.name, u.phone ,u.email
    FROM users u
    INNER JOIN chats c ON c.user_id = u.id
    ORDER BY u.name ASC
  `;
  const result = await client.query(query);
   return result.rows || [];
}






  // Get or create chat for user
  static async getOrCreateChat(userId) {
    let chat = await this.getChatByUserId(userId);
    if (!chat) {
      chat = await this.createChat(userId);
    }
    return chat;
  }
}

module.exports = ChatModel;

