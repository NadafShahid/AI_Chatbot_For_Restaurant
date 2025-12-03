import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:3001/api/cart";
const MENU_API = "http://localhost:3001/api/menu";
const ORDER_API = "http://localhost:3001/api/orders";
const TABLES_API = "http://localhost:3001/api/tables";

export default function Cart() {
  const auth = useAuth();
  const navigate = useNavigate();
  
  // Handle case where AuthContext is null (component outside provider or still loading)
  if (!auth) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-600">Loading authentication...</p>
      </div>
    );
  }
  
  const { user } = auth;
  const USER_ID = user ? user.id : null;

  const [cartItems, setCartItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Order placement states
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (!USER_ID) {
      setCartItems([]);
      setMenuItems([]);
      setTotalPrice(0);
      setError("User not logged in");
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/${USER_ID}`).then((res) => res.json()),
      fetch(MENU_API).then((res) => res.json()),
    ])
      .then(([cartJson, menuJson]) => {
        if (cartJson.success && menuJson.success) {
          // Handle case where cart data might be empty/null
          const cartData = cartJson.data || { items: [], total: 0 };
          const cartItemsList = cartData.items || [];

          const mergedItems = cartItemsList.map((cartItem) => {
            const menuItem = menuJson.data.find(
              (m) => m.id === cartItem.item_id
            );
            return {
              ...cartItem,
              image_url: menuItem ? menuItem.image_url : cartItem.image_url,
              description: menuItem ? menuItem.description : cartItem.description,
              name: menuItem ? menuItem.name : cartItem.name,
              price: menuItem ? menuItem.price : cartItem.price,
            };
          });

          setCartItems(mergedItems);
          setMenuItems(menuJson.data || []);
          setTotalPrice(parseFloat(cartData.total) || 0);
          setError(null);
        } else {
          setError("Failed to load cart or menu");
        }
      })
      .catch((err) => {
        console.error("Cart fetch error:", err);
        setError("Failed to load cart or menu");
      })
      .finally(() => setLoading(false));
  }, [USER_ID]);

  const mergeCartWithMenu = (items) => {
    return items.map((cartItem) => {
      const menuItem = menuItems.find((m) => m.id === cartItem.item_id);
      return {
        ...cartItem,
        image_url: menuItem ? menuItem.image_url : cartItem.image_url,
        description: menuItem ? menuItem.description : cartItem.description,
        name: menuItem ? menuItem.name : cartItem.name,
        price: menuItem ? menuItem.price : cartItem.price,
      };
    });
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity < 0 || !USER_ID) return;

    fetch(`${API_BASE}/${USER_ID}/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId, quantity }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          const cartData = json.data || { items: [], total: 0 };
          setCartItems(mergeCartWithMenu(cartData.items || []));
          setTotalPrice(parseFloat(cartData.total) || 0);
          setError(null);
        } else {
          setError("Failed to update item quantity");
        }
      })
      .catch(() => setError("Failed to update item quantity"));
  };

  const removeItem = (itemId) => {
    if (!USER_ID) return;

    fetch(`${API_BASE}/${USER_ID}/remove/${itemId}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          const cartData = json.data || { items: [], total: 0 };
          setCartItems(mergeCartWithMenu(cartData.items || []));
          setTotalPrice(parseFloat(cartData.total) || 0);
          setError(null);
        } else {
          setError("Failed to remove item");
        }
      })
      .catch(() => setError("Failed to remove item"));
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      alert("Please login to place an order");
      navigate("/login");
      return;
    }

    // Check if table is selected
    const selectedTable = localStorage.getItem("selectedTable");
    if (!selectedTable) {
      alert("Please select a table first");
      navigate("/select-table");
      return;
    }

    const tableData = JSON.parse(selectedTable);

    setOrderLoading(true);

    try {
      const orderData = {
        user_id: user.id,
        payment_method: "pending",
        table_id: tableData.id,
      };

      const response = await fetch(ORDER_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
        // Clear cart after successful order
        await clearCart();

        // Clear selected table after order
        localStorage.removeItem("selectedTable");

        // Navigate to order success page
        navigate("/order-success", {
          state: { order: data.data },
        });
      } else {
        alert("Failed to place order: " + data.message);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setOrderLoading(false);
    }
  };

  const clearCart = async () => {
    // Clear cart items from state
    setCartItems([]);
    setTotalPrice(0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-600">Loading cart...</p>
      </div>
    );
  }

  if (!USER_ID) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <p className="text-xl text-gray-700 font-semibold">
          You must log in to view your cart.
        </p>

        <a
          href="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
        >
          Login
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pt-6">
  <h1 className="text-3xl font-bold mb-8 text-center">Your Cart</h1>

  {error && (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 shadow">
      {error}
    </div>
  )}

  {cartItems.length === 0 ? (
    <div className="text-center py-16">
      <div className="mb-4">
        <svg
          className="w-24 h-24 mx-auto text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>

      <p className="text-2xl text-gray-700 font-semibold mb-2">Your cart is empty</p>
      <p className="text-gray-500 mb-6">Add something delicious to continue</p>

      <button
        onClick={() => navigate("/menu")}
        className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-8 rounded-full shadow-md transition"
      >
        Browse Menu
      </button>
    </div>
  ) : (
    <>
      {/* Cart Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cartItems.map((item) => (
          <div
            key={item.item_id}
            className="bg-white rounded-2xl shadow-md p-4 flex flex-col border border-gray-100 hover:shadow-lg transition"
          >
            <img
              src={item.image_url}
              onError={(e) => (e.target.src = 'https://placehold.co/600x400')}
              alt={item.name}
              className="w-full h-40 object-cover rounded-xl mb-3"
            />

            <div className="flex justify-between items-start mb-1">
              <div className="font-semibold text-lg text-gray-800">{item.name}</div>
              <div className="text-green-600 font-bold text-lg">₹{item.price}</div>
            </div>

            <div className="text-gray-500 text-sm mb-4">{item.description}</div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold w-8 h-8 rounded-full"
                >
                  -
                </button>

                <span className="font-semibold text-lg">{item.quantity}</span>

                <button
                  onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold w-8 h-8 rounded-full"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => removeItem(item.item_id)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Total + Button */}
      <div className="mt-10 space-y-4">
        <div className="flex justify-between items-center bg-yellow-50 p-5 rounded-2xl shadow-sm">
          <span className="text-xl font-semibold text-gray-800">Total</span>
          <span className="text-3xl font-bold text-green-600">
            ₹{totalPrice.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handlePlaceOrder}
            disabled={orderLoading}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-bold py-3 px-10 rounded-full text-lg shadow-md transition disabled:cursor-not-allowed"
          >
            {orderLoading ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </>
  )}
</div>

  );
}