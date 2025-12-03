import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, User, Send, Clock } from "lucide-react";
import AdminNavbar from "../components/AdminNavbar"; // adjust path
import { useLocation } from "react-router-dom";

export default function ChatDashboard({ user, handleLogout }) {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) fetchMessages(selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    // scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3001/api/chat/users");
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
      else setError("Failed to fetch users");
    } catch (err) {
      setError("Error fetching users: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`http://localhost:3001/api/chat/messages/${userId}`);
      const data = await res.json();
      if (data.success) setMessages(data.data.messages || []);
      else setError("Failed to fetch messages");
    } catch (err) {
      setError("Error fetching messages: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;

    try {
      const res = await fetch("http://localhost:3001/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          messageText: newMessage,
          senderRole: "admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage("");
        fetchMessages(selectedUserId);
      } else setError("Failed to send message");
    } catch (err) {
      setError("Error sending message: " + err.message);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <AdminNavbar user={user} handleLogout={handleLogout} />

      <div className="flex h-screen bg-gray-100  ">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Chat Users
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && users.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No users with chats found</div>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedUserId === u.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {u.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{u.username || `User ${u.id}`}</div>
                      <div className="text-sm text-gray-500">{u.email || "No email"}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat */}
        <div className="flex-1 flex flex-col">
          {selectedUserId ? (
            <>
              <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
                <User className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {users.find((u) => u.id === selectedUserId)?.username || `User ${selectedUserId}`}
                  </h3>
                  <p className="text-sm text-gray-500">{messages.length} messages</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
                )}

                {loading ? (
                  <div className="text-center text-gray-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500">No messages yet</div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === selectedUserId ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-xl px-4 py-3 rounded-lg ${
                          msg.sender_id === selectedUserId ? "bg-gray-200 text-gray-800" : "bg-blue-500 text-white"
                        }`}
                      >
                        <div className="text-sm mb-1">{msg.message_text}</div>
                        <div
                          className={`text-xs flex items-center gap-1 ${
                            msg.sender_id === selectedUserId ? "text-gray-500" : "text-blue-100"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {formatDate(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="bg-white border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage}>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a user to view their messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
