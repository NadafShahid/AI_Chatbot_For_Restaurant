const { client } = require('../config/database');

class MessageModel {
  // Create a new message
  static async createMessage(chatId, senderId, messageText) {
    const query = `
      INSERT INTO messages (chat_id, sender_id, message_text)
      VALUES ($1, $2, $3)
      RETURNING id, chat_id, sender_id, message_text, timestamp
    `;
    const result = await client.query(query, [chatId, senderId, messageText]);
    return result.rows[0];
  }

  // Get all messages for a chat
  static async getMessagesByChatId(chatId) {
    const query = `
      SELECT 
        m.id,
        m.chat_id,
        m.sender_id,
        m.message_text,
        m.timestamp,
        u.name as sender_name,
        u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = $1
      ORDER BY m.timestamp ASC
    `;
    const result = await client.query(query, [chatId]);
    return result.rows;
  }
}

module.exports = MessageModel;

