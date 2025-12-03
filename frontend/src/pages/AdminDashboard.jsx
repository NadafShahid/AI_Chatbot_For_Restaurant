import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import AdminNavbar from "../components/AdminNavbar";


export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" or "chat"

  useEffect(() => {
    if (!user) {
      navigate("/admin/login");
      return;
    }

    if (user.role !== "admin") {
      navigate("/");
      return;
    }

    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const ordersRes = await axios.get("http://localhost:3001/api/orders");
      const ordersData = ordersRes.data.success ? ordersRes.data.data : [];

      const usersRes = await axios.get("http://localhost:3001/api/users");
      const usersData = usersRes.data.success ? usersRes.data.data : [];

      setStats({
        totalOrders: ordersData.length,
        pendingOrders: ordersData.filter(o => o.status === "pending").length,
        totalRevenue: ordersData.reduce(
          (sum, order) => sum + parseFloat(order.total_amount || 0),
          0
        ),
        totalUsers: usersData.length,
      });

      setOrders(ordersData.slice(0, 10));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:3001/api/orders/${orderId}/status`, {
        status: newStatus,
      });
      fetchDashboardData();
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update order status");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
       <AdminNavbar user={user} handleLogout={handleLogout} />

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
       

        {/* Tab Content */}
        {activeTab === "dashboard" && (
          <div>
            {error && (
              <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                <p className="font-semibold">{error}</p>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Orders */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {stats.totalOrders}
                    </p>
                  </div>
                </div>
              </div>
              {/* Pending Orders */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Pending Orders</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {stats.pendingOrders}
                    </p>
                  </div>
                </div>
              </div>
              {/* Total Revenue */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      ₹{stats.totalRevenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              {/* Total Users */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Total Users</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {stats.totalUsers}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
                <button
                  onClick={fetchDashboardData}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                >
                  Refresh
                </button>
              </div>

              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No orders found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Order ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold">#{order.id}</td>
                          <td className="px-4 py-3">{order.user_name || "N/A"}</td>
                          <td className="px-4 py-3 font-semibold text-green-600">
                            ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : order.status === "delivered"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={order.status}
                              onChange={e =>
                                updateOrderStatus(order.id, e.target.value)
                              }
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="accepted">Accepted</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
                              <option value="delivered">Delivered</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        

      </div>
    </div>
  );
}
