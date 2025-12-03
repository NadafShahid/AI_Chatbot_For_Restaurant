// src/components/AdminNavbar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  }
  
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Left: Title & Greeting */}
       <div
          onClick={() => navigate("/admin/dashboard")}
          className="cursor-pointer"
        >
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome, {user?.name || "Admin"}</p>
        </div>

        {/* Right: Navigation Buttons */}
        <div className="flex gap-3">
          
          <button 
            onClick={() => navigate("/")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Home
          </button>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/admin/chats")}
            className="bg-red-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Chat
          </button>

          <button
            onClick={() => navigate("/admin/tables")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Tables  
          </button>

          <button
            onClick={() => navigate("/admin/users")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Users
          </button>

          <button
            onClick={() => navigate("/admin/pos")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            POS System
          </button>

          <button
            onClick={() => navigate("/admin/menu")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Menu Mgmt
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
