import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

// QR Code Payment Modal Component
function QRPaymentModal({ order, onClose, onPaymentSuccess }) {
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
  if (!transactionId.trim()) {
    setError("Please enter transaction ID");
    return;
  }

  setSubmitting(true);
  setError(null);

  try {
    // Step 1: Create/update payment record with transaction ID
    const paymentResponse = await fetch("http://localhost:3001/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: order.order_id,
        amount: parseFloat(order.amount || order.order_total || 0),
        method: "online",
        transaction_id: transactionId, // <-- Save TXN ID here
        status: "completed", // <-- Use "completed" for payment status
      }),
    });

    const paymentData = await paymentResponse.json();
    if (!paymentData.success) throw new Error(paymentData.message || "Payment failed");

    // Step 2: Update order status and payment method
    const orderResponse = await fetch(`http://localhost:3001/api/orders/${order.order_id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "paid",
        payment_method: "online", // mark order as paid online
      }),
    });

    const orderData = await orderResponse.json();
    if (!orderData.success) throw new Error(orderData.message || "Order update failed");

    // Success: close modal & refresh pending payments
    alert(`Payment successful! Transaction ID: ${transactionId}`);
    onPaymentSuccess();
    onClose();

  } catch (err) {
    setError(err.message || "Payment failed. Please try again.");
  } finally {
    setSubmitting(false);
  }
};
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Pay with UPI</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Order ID</p>
            <p className="font-semibold text-gray-800">#{order.order_id}</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{parseFloat(order.amount || order.order_total || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-6">
          <div className="flex justify-center mb-3">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=merchant@upi&pn=Restaurant&am=${order.amount || order.order_total || 0}&cu=INR&tn=Order${order.order_id}`}
              alt="Payment QR Code"
              className="w-48 h-48"
            />
          </div>
          <p className="text-center text-sm text-gray-600">
            Scan with any UPI app to pay
          </p>
        </div>

        {/* Transaction ID Input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Enter Transaction ID
          </label>
          <input
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="e.g., 123456789012"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            You'll find this in your UPI app after payment
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Pending Payments Component
function PendingPayments({ userId }) {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadPendingOrders = () => {
    if (!userId) return;

    fetch("http://localhost:3001/api/payments")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          // Filter pending payments for this user
          const pending = json.data.filter(
            (payment) =>
              payment.user_id === userId &&
              payment.status === "pending"
          );
          setPendingOrders(pending);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPendingOrders();
  }, [userId]);

  const handlePaymentSuccess = () => {
    loadPendingOrders(); // Reload after successful payment
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-600">
        Loading pending payments...
      </div>
    );
  }

  if (pendingOrders.length === 0) {
    return (
      <div className="text-center py-8 bg-green-50 rounded-lg">
        No pending payments. All caught up!
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {pendingOrders.map((order) => (
          <div
            key={order.id}
            className="border-l-4 border-orange-500 bg-orange-50 rounded-lg p-5 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-lg font-bold text-gray-800">
                  Order #{order.order_id}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Amount: ₹{parseFloat(order.amount).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Payment Method: {order.method}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(order)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Pay Online
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <QRPaymentModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}


// Order History Component
function OrderHistory({ userId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    fetch(`http://localhost:3001/api/orders?user_id=${userId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          // Filter out pending orders (shown in pending payments section)
          const completedOrders = json.data.filter(
            (order) => order.status !== "pending"
          );
          setOrders(completedOrders);
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2"
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
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <svg
          className="w-16 h-16 text-gray-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <p className="text-gray-600 text-lg mb-4">No completed orders yet.</p>
        <Link
          to="/menu"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Browse Menu to Place an Order
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="border border-gray-200 rounded-lg p-6 shadow-sm bg-white hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Order #{order.id}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(order.created_at).toLocaleString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                order.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : order.status === "delivered"
                  ? "bg-green-100 text-green-800"
                  : order.status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {order.status?.toUpperCase() || "PENDING"}
            </span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-semibold capitalize">
                {order.payment_method?.replace("_", " ") || "N/A"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-xl font-bold text-green-600">
                ₹
                {parseFloat(
                  order.total_amount || order.total_price || 0
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Main Profile Component
export default function Profile() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Loading authentication...</p>
      </div>
    );
  }

  const { user, logout, authLoading } = auth;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    fetch(`http://localhost:3001/api/users/${user.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setProfile(json.data);
        else setError("Failed to load profile");
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
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
          <p className="text-lg text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
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
          <p className="text-lg text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-4 mt-20">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
          <p className="text-gray-600">
            Manage your account and view order history
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </div>

      {/* Profile Info */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {profile?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {profile?.name || "User"}
            </h2>
            <p className="text-gray-600">{profile?.email || ""}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Full Name
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-800">{profile?.name || "N/A"}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Email Address
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-800">{profile?.email || "N/A"}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Phone Number
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-800">
                {profile?.phone || "Not provided"}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Role
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold capitalize">
                {profile?.role || user?.role || "Customer"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payments Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <svg
            className="w-6 h-6 text-orange-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Pending Payments
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Complete payment for your pending orders
            </p>
          </div>
        </div>
        <PendingPayments userId={user.id} />
      </div>

      {/* Order History */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Order History</h2>
            <p className="text-gray-600 text-sm mt-1">
              View all your completed orders
            </p>
          </div>
        </div>
        <OrderHistory userId={user.id} />
      </div>
    </div>
  );
}