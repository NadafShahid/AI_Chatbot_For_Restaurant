import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const CHAT_API = "http://localhost:3001/api/chat";
const USERS_API = "http://localhost:3001/api/users";
const WEBHOOK_PROXY =   `http://localhost:3001/api/chat/webhook`; // Use backend proxy to avoid CORS issues

export default function ChatWidget({ isOpen, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);

  // Load chat history when widget opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadChatHistory();
    }
  }, [isOpen, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = async () => {
    try {
      const res = await axios.get(`${CHAT_API}/${user.id}`);
      if (res.data.success) {
        setChatId(res.data.data.chatId);
        const formattedMessages = res.data.data.messages.map((msg) => ({
          id: msg.id,
          text: msg.message_text,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          senderRole: msg.sender_role,
          timestamp: msg.timestamp,
          isUser: msg.sender_id === user.id,
        }));
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  };

  const getReplierName = async (userId) => {
    try {
      const res = await axios.get(`${USERS_API}/${userId}`);
      if (res.data.success && res.data.data) {
        const userData = res.data.data;
        if (userData.role === "admin") {
          return "Admin";
        } else if (userData.role === "bot") {
          return "Bot";
        }
        return userData.name || "Bot";
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
    return "Bot";
  };

  const saveMessageToDB = async (senderId, messageText, senderRole = null) => {
    try {
      await axios.post(`${CHAT_API}/messages`, {
        userId: user.id,
        senderId: senderId,
        messageText: messageText,
        senderRole: senderRole,
      });
    } catch (err) {
      console.error("Error saving message to DB:", err);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !user?.id || loading) return;

    const userMessage = inputText.trim();
    setInputText("");
    setLoading(true);

    // Add user message to UI immediately
    const userMsg = {
      id: Date.now(),
      text: userMessage,
      senderId: user.id,
      senderName: user.name || "You",
      senderRole: user.role,
      timestamp: new Date().toISOString(),
      isUser: true,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Save user message to database
    await saveMessageToDB(user.id, userMessage);

    try {
      // Send to webhook via backend proxy (solves CORS issue)
      // Use GET request with query parameter for n8n GET webhooks
      const webhookRes = await axios.get(WEBHOOK_PROXY, {
        params: {
          message: userMessage,
          userId: user.id,
          
        },
        timeout: 30000, // 30 second timeout
      });

      // Check if backend returned an error
      if (!webhookRes.data.success) {
        // Backend returned an error (e.g., n8n webhook not registered)
        const errorData = webhookRes.data.error || webhookRes.data;
        let errorMessage = errorData.message || "Webhook error occurred";
        if (errorData.details && errorData.details.hint) {
          errorMessage += `\n\n${errorData.details.hint}`;
        } else if (errorData.hint) {
          errorMessage += `\n\n${errorData.hint}`;
        }
        throw new Error(errorMessage);
      }

      // Extract response from webhook
      // The backend proxy wraps the response in { success: true, data: {...} }
      let webhookData = webhookRes.data.data;

      let responseText = "";
      let replierId = null;

      // Handle different response formats
      if (webhookData) {
        if (typeof webhookData === "string") {
          responseText = webhookData;
        } else if (webhookData.response || webhookData.message || webhookData.text) {
          responseText = webhookData.response || webhookData.message || webhookData.text;
          // Try to get user ID from various possible fields
          replierId = webhookData.userId || 
                      webhookData.replierId || 
                      webhookData.user_id || 
                      webhookData.replier_id ||
                      webhookData.user?.id ||
                      webhookData.replier?.id;
        } else if (webhookData.user) {
          // If response has a user object, extract from it
          responseText = webhookData.user.message || webhookData.user.response || JSON.stringify(webhookData);
          replierId = webhookData.user.id || webhookData.user.userId;
        } else {
          responseText = JSON.stringify(webhookData);
        }
      } else {
        // Empty response
        throw new Error("Webhook returned an empty response. Please check n8n workflow configuration.");
      }

      // Get replier name
      let replierName = "Bot";
      if (replierId) {
        replierName = await getReplierName(replierId);
      } else {
        // Default to bot if no replier ID
        replierName = "Bot";
      }

      // Add bot response to UI
      const botMsg = {
        id: Date.now() + 1,
        text: responseText,
        senderId: replierId || 0, // Use 0 or bot ID if not provided
        senderName: replierName,
        senderRole: replierId ? "bot" : "bot",
        timestamp: new Date().toISOString(),
        isUser: false,
      };
      setMessages((prev) => [...prev, botMsg]);

      // Save bot response to database
      // Determine if it's bot or admin based on replier name
      const senderRole = replierName === "Admin" ? "admin" : "bot";
      await saveMessageToDB(replierId || 0, responseText, senderRole);
    } catch (err) {
      console.error("Error sending message:", err);
      
      // Use the error message from the exception if available
      let errorText = err.message || "Sorry, I encountered an error. Please try again.";
      
      // If it's a webhook error, provide more context
      if (errorText.includes("webhook") || errorText.includes("n8n") || errorText.includes("not registered")) {
        errorText = "⚠️ " + errorText;
      }
      
      const errorMsg = {
        id: Date.now() + 1,
        text: errorText,
        senderId: 0,
        senderName: "System",
        senderRole: "bot",
        timestamp: new Date().toISOString(),
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md h-[620px] flex flex-col overflow-hidden border border-gray-100">

      {/* Header */}
      <div className="bg-yellow-500 px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">AI Assistant</h2>
          <p className="text-white text-sm opacity-80 -mt-1">
            Powered by Restaurant AI
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white text-3xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            👋 Start chatting with your AI assistant!
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.isUser ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm text-sm ${
                msg.isUser
                  ? "bg-yellow-500 text-white rounded-br-none"
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
              }`}
            >
              {!msg.isUser && (
                <p className="text-xs font-semibold text-gray-500 mb-1">
                  {msg.senderName}
                </p>
              )}

              <p className="leading-relaxed whitespace-pre-wrap break-words">
                {msg.text}
              </p>

              <p className="text-[11px] mt-1 opacity-60">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none text-sm"
            disabled={loading || !user?.id}
          />

          <button
            onClick={sendMessage}
            disabled={loading || !inputText.trim()}
            className="ml-3 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full text-sm font-semibold disabled:bg-gray-300"
          >
            Send
          </button>
        </div>

        {!user?.id && (
          <p className="text-xs text-red-500 mt-2 text-center">
            Please log in to chat.
          </p>
        )}
      </div>
    </div>
  </div>
  );
}

