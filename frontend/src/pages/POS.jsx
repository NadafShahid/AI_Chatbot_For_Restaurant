import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const POS_API = "http://localhost:3001/api/pos";
const MENU_API = "http://localhost:3001/api/menu";
const USERS_API = "http://localhost:3001/api/users";

// Default placeholder image for items without images
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/150x100?text=No+Image";

// Helper to ensure full image URL
const getFullImageUrl = (url) => {
  if (!url) return PLACEHOLDER_IMAGE;
  // If already full URL
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Otherwise prepend backend host
  return `http://localhost:5173/${url}`;
};

export default function POS() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/admin/login");
      return;
    }
    fetchData();
    const interval = setInterval(fetchActiveOrders, 5000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [menuRes, usersRes, ordersRes] = await Promise.all([
        axios.get(MENU_API),
        axios.get(USERS_API),
        axios.get(`${POS_API}/orders/active`),
      ]);
      if (menuRes.data.success) {
        // Fix image URLs here
        const itemsWithFullUrl = (menuRes.data.data || []).map((item) => ({
          ...item,
          image_url: getFullImageUrl(item.image_url),
        }));
        setMenuItems(itemsWithFullUrl);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.data || []);
        if (usersRes.data.data?.length > 0) {
          setSelectedUserId(usersRes.data.data[0].id.toString());
        }
      }
      if (ordersRes.data.success) setActiveOrders(ordersRes.data.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOrders = async () => {
    try {
      const res = await axios.get(`${POS_API}/orders/active`);
      if (res.data.success) setActiveOrders(res.data.data || []);
    } catch (err) {
      console.error("Error fetching active orders:", err);
    }
  };

  const addItemToOrder = (item) => {
    const existingItem = selectedItems.find((i) => i.item_id === item.id);
    if (existingItem) {
      setSelectedItems(
        selectedItems.map((i) =>
          i.item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          item_id: item.id,
          quantity: 1,
          name: item.name,
          price: item.price,
          image_url: getFullImageUrl(item.image_url), // use helper here
        },
      ]);
    }
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      setSelectedItems(selectedItems.filter((i) => i.item_id !== itemId));
    } else {
      setSelectedItems(
        selectedItems.map((i) =>
          i.item_id === itemId ? { ...i, quantity } : i
        )
      );
    }
  };

  const removeItem = (itemId) => {
    setSelectedItems(selectedItems.filter((i) => i.item_id !== itemId));
  };

  const calculateTotal = () =>
    selectedItems.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0
    );

  const handleCreateOrder = async () => {
    if (!selectedUserId) {
      setError("Please select a user");
      return;
    }
    if (selectedItems.length === 0) {
      setError("Please add at least one item to the order");
      return;
    }
    try {
      setCreatingOrder(true);
      setError(null);
      setSuccess(null);
      const orderData = {
        user_id: parseInt(selectedUserId),
        items: selectedItems.map((item) => ({
          item_id: item.item_id,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
      };
      const res = await axios.post(`${POS_API}/order`, orderData);
      if (res.data.success) {
        setSuccess(`Order #${res.data.data.id} created successfully!`);
        setSelectedItems([]);
        setPaymentMethod("cash");
        fetchActiveOrders();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(res.data.message || "Failed to create order");
      }
    } catch (err) {
      console.error("Error creating order:", err);
      setError(err.response?.data?.message || "Failed to create order.");
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleCloseOrder = async (orderId) => {
    if (!confirm("Are you sure you want to close this order?")) return;
    try {
      const res = await axios.put(`${POS_API}/orders/${orderId}/close`);
      if (res.data.success) {
        setSuccess(`Order #${orderId} closed successfully!`);
        fetchActiveOrders();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(res.data.message || "Failed to close order");
      }
    } catch (err) {
      console.error("Error closing order:", err);
      setError(err.response?.data?.message || "Failed to close order.");
    }
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
          <p className="text-lg text-gray-600">Loading POS...</p>
        </div>
      </div>
    );
  }

  // -------------------- RETURN JSX --------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Point of Sale (POS)
            </h1>
            <p className="text-sm text-gray-600">
              Quick order management system
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p className="font-semibold">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
            <p className="font-semibold">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Menu Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Menu Items</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                {menuItems
                  .filter((item) => item.availability)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => addItemToOrder(item)}
                    >
                      <div className="relative h-32 bg-gray-100">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = PLACEHOLDER_IMAGE;
                          }}
                        />
                        <span className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-lg font-bold text-sm shadow">
                          ₹{parseFloat(item.price).toFixed(2)}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addItemToOrder(item);
                          }}
                          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-colors"
                        >
                          Add to Order
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary & Active Orders */}
          <div className="space-y-6">
            {/* Current Order */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Current Order</h2>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 max-h-[300px] overflow-y-auto">
                {selectedItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No items selected
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedItems.map((item) => (
                      <div
                        key={item.item_id}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                      >
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = PLACEHOLDER_IMAGE;
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() =>
                                updateQuantity(item.item_id, item.quantity - 1)
                              }
                              className="w-6 h-6 bg-gray-300 hover:bg-gray-400 rounded text-sm font-bold"
                            >
                              -
                            </button>
                            <span className="text-sm font-semibold w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.item_id, item.quantity + 1)
                              }
                              className="w-6 h-6 bg-gray-300 hover:bg-gray-400 rounded text-sm font-bold"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeItem(item.item_id)}
                              className="ml-2 text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <p className="font-bold text-green-600">
                          ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                </select>
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₹{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={creatingOrder || selectedItems.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {creatingOrder ? "Creating Order..." : "Create Order"}
              </button>
            </div>

            {/* Active Orders */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Active Orders</h2>
                <button
                  onClick={fetchActiveOrders}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
                >
                  Refresh
                </button>
              </div>
              {activeOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No active orders</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold">Order #{order.id}</p>
                          <p className="text-sm text-gray-600">
                            {order.user_name || `User #${order.user_id}`}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            order.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <div>
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="font-bold text-green-600">
                            ₹{parseFloat(order.total_amount).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCloseOrder(order.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                          Close Order
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
