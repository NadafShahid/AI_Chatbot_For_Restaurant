import { useState, useEffect } from "react";
import { ShoppingCart, Star, Heart, MapPin } from "lucide-react";

export default function Menu() {
  const [menu, setMenu] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [category, setCategory] = useState("All");
  const [cartCount, setCartCount] = useState(0);

  const API_URL = "http://localhost:3001/api/menu";

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setMenu(json.data);
          setFiltered(json.data);
        }
      })
      .catch((err) => console.error("API ERROR:", err));

    // Update cart count
    updateCartCount();
  }, []);

  const updateCartCount = () => {
    const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    const count = guestCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    setCartCount(count);
  };

  const filterItems = (cat) => {
    setCategory(cat);
    if (cat === "All") {
      setFiltered(menu);
    } else {
      const result = menu.filter((item) => item.category === cat);
      setFiltered(result);
    }
  };

  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user ? user.id : null;
  };

  const addToCart = (itemId) => {
    const userId = getUserId();
    if (userId) {
      fetch(`http://localhost:3001/api/cart/${userId}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, quantity: 1 }),
      })
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            updateCartCount();
            showNotification("Item added to cart!");
          } else {
            showNotification("Failed to add item", true);
          }
        })
        .catch(() => showNotification("Failed to add item", true));
    } else {
      let guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
      let index = guestCart.findIndex(item => item.item_id === itemId);
      if (index >= 0) {
        guestCart[index].quantity += 1;
      } else {
        const menuItem = filtered.find(item => item.id === itemId);
        if (menuItem) {
          guestCart.push({
            item_id: menuItem.id,
            name: menuItem.name,
            price: parseFloat(menuItem.price),
            quantity: 1,
            image_url: menuItem.image_url,
            description: menuItem.description,
          });
        }
      }
      localStorage.setItem('guest_cart', JSON.stringify(guestCart));
      updateCartCount();
      showNotification("Item added to cart!");
    }
  };

  const showNotification = (message, isError = false) => {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `fixed top-24 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-semibold z-50 transition-all ${
      isError ? 'bg-red-500' : 'bg-green-500'
    }`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  // Get unique categories from menu
  const categories = ["All", ...new Set(menu.map(item => item.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      

      

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4 p-3 bg-orange-100 rounded-full">
            <span className="text-3xl">⭐</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Our Signature Dishes
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            From classic favorites to modern culinary creations, our menu is designed to tantalize your taste buds. Every
            dish is made with the freshest ingredients and an extra dash of love.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => filterItems(cat)}
              className={`px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 ${
                category === cat
                  ? "bg-gray-900 text-white shadow-lg"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-orange-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.filter(item => item.availability === true).map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group"
            >
              <div className="relative overflow-hidden">
                <img
                  src={`http://localhost:5173${item.image_url}` || "https://placehold.co/600x400"}
                  onError={(e) => { e.target.src = "https://placehold.co/600x400?text=No+Image"; }}
                  alt={item.name}
                  className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                />
               
                <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-1">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-gray-800">4.5</span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-xl text-gray-900">{item.name}</h3>
                  <span className="text-orange-600 font-bold text-lg">₹{item.price}</span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                
                {getUserId() ? (
                  <button
                    onClick={() => addToCart(item.id)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-full transition transform hover:scale-105 shadow-md"
                  >
                    Add to Cart
                  </button>
                ) : (
                  <a
                    href="/login"
                    className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-full transition transform hover:scale-105 shadow-md"
                  >
                    Login to Order
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-xl">No items found in this category.</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-11/12 md:w-96">
          <a
            href="/cart"
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold py-4 px-8 rounded-full shadow-2xl transition-all transform hover:scale-105"
          >
            <ShoppingCart size={24} />
            <span>Go to Cart ({cartCount} items)</span>
          </a>
        </div>
      )}

      {/* Call to Action Section */}
      
    </div>
  );
}