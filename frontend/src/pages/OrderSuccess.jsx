import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    // Get order data from navigation state
    if (location.state && location.state.order) {
      setOrder(location.state.order);
    } else {
      // If no order data, redirect to home
      navigate("/");
    }
  }, [location, navigate]);

  if (!order) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  const orderDate = new Date(order.created_at).toLocaleString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4">

  {/* Success Header */}
  <div className="text-center mb-10">
    <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full shadow-inner mb-5">
      <svg
        className="w-14 h-14 text-green-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>

    <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
      Order Placed Successfully!
    </h1>

    <p className="text-gray-600 text-lg">
      Your delicious food is now being prepared. Sit tight!
    </p>
  </div>

  {/* Order Details */}
  <div className="bg-white border rounded-2xl shadow-lg p-6 mb-8">

    <h2 className="text-2xl font-bold mb-6 text-gray-900">Order Summary</h2>

    <div className="space-y-4 mb-8">
      <div className="flex justify-between text-lg">
        <span className="text-gray-600">Order ID:</span>
        <span className="font-semibold">#{order.id}</span>
      </div>

      <div className="flex justify-between text-lg">
        <span className="text-gray-600">Order Date:</span>
        <span className="font-semibold">{orderDate}</span>
      </div>

      <div className="flex justify-between text-lg">
        <span className="text-gray-600">Payment Method:</span>
        <span className="font-semibold capitalize">
          {order.payment_method?.replace("_", " ") || "Cash on Delivery"}
        </span>
      </div>

      <div className="flex justify-between text-lg">
        <span className="text-gray-600">Status:</span>
        <span className="px-4 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
          {order.status || "Pending"}
        </span>
      </div>
    </div>

    {/* Order Items */}
    {order.items?.length > 0 && (
      <div className="border-t pt-6">
        <h3 className="font-bold text-xl mb-4">Ordered Items</h3>

        <div className="space-y-4">
          {order.items.map((item, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-xl flex justify-between items-start border hover:shadow-md transition"
            >
              <div className="flex-1">
                <p className="font-semibold text-lg">{item.name}</p>

                {item.description && (
                  <p className="text-sm text-gray-500">{item.description}</p>
                )}

                <p className="text-sm text-gray-700 mt-2">
                  {item.quantity} × ₹{parseFloat(item.price).toFixed(2)}
                </p>
              </div>

              <p className="font-bold text-green-600 text-lg">
                ₹{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Total */}
    <div className="border-t mt-8 pt-6">
      <div className="flex justify-between items-center">
        <span className="text-2xl font-bold text-gray-800">Total Amount</span>
        <span className="text-3xl font-extrabold text-green-600">
          ₹{parseFloat(order.total_amount || 0).toFixed(2)}
        </span>
      </div>
    </div>
  </div>

  {/* Next Steps */}
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 shadow-sm">
    <h3 className="text-xl font-bold text-blue-900 mb-4">What Happens Next?</h3>

    <ul className="space-y-3 text-blue-800 text-lg">
      <li className="flex">
        <span className="mr-2">✓</span> We’ve received your order.
      </li>
      <li className="flex">
        <span className="mr-2">✓</span> Our team has started preparing your food.
      </li>
      
    </ul>
  </div>

  {/* Action Buttons */}
  <div className="flex flex-col sm:flex-row gap-4 justify-center">
    <Link
      to="/menu"
      className="flex-1 text-center bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-full text-lg shadow-md transition"
    >
      Browse Menu to Place an Order
    </Link>

    <Link
      to="/profile"
      className="flex-1 text-center bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-full text-lg shadow-md transition"
    >
      View Orders
    </Link>
  </div>
</div>

  );
}

