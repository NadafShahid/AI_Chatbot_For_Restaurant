import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";
import { ShoppingCart, User, MapPin, Search, X, LogIn, Shield, Menu } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [cartItemCount, setCartItemCount] = useState(0);
  const [selectedTable, setSelectedTable] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch cart count
  useEffect(() => {
    if (!user?.id) return setCartItemCount(0);

    const fetchCartCount = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(
          `http://localhost:3001/api/cart/${user.id}`,
          { headers }
        );

        const items = res.data?.data?.items || [];
        const total = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        setCartItemCount(total);
      } catch (err) {
        setCartItemCount(0);
      }
    };

    fetchCartCount();
    const interval = setInterval(fetchCartCount, 10000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  // Load selected table
  useEffect(() => {
    const saved = localStorage.getItem("selectedTable");
    if (saved) setSelectedTable(JSON.parse(saved));
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-gray-900 block leading-tight">
                Diamond Restaurant
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={12} />
                <span>Sangli</span>
              </div>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search for dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              to="/"
              className={`font-semibold ${isActive("/") ? "text-orange-600" : "text-gray-700 hover:text-orange-600"}`}
            >
              Home
            </Link>

            <Link
              to="/menu"
              className={`font-semibold ${isActive("/menu") ? "text-orange-600" : "text-gray-700 hover:text-orange-600"}`}
            >
              Menu
            </Link>

            {/* Table Selection */}
            {user && (
              selectedTable ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full">
                  <span className="text-sm font-medium text-orange-700">
                    Table {selectedTable.table_number}
                  </span>
                   
                    <button
                      onClick={() => {
                        localStorage.removeItem("selectedTable");
                        setSelectedTable(null);
                        navigate("/select-table");
                      }}
                      className="text-xs text-orange-600 hover:text-orange-800 underline"
                    >
                      Change
                    </button>
                  
                </div>
              ) : (
                <Link to="/select-table" className="font-semibold text-gray-700 hover:text-orange-600">
                  Select Table
                </Link>
              )
            )}

            {/* Cart */}
            {user && (
              <Link to="/cart" className="relative p-2 hover:bg-orange-50 rounded-full">
                <ShoppingCart size={24} className={isActive("/cart") ? "text-orange-600" : "text-gray-700"} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount > 9 ? "9+" : cartItemCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full"
                  >
                    <Shield size={16} /> Admin
                  </Link>
                )}

                <Link
                  to="/profile"
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
                    isActive("/profile") ? "bg-orange-100 text-orange-700" : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <User size={20} />
                  {user.name?.split(" ")[0]}
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/admin/login" className="text-gray-600 hover:text-indigo-600 flex items-center gap-1">
                  <Shield size={16} /> Admin
                </Link>

                <Link
                  to="/login"
                  className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2 rounded-full shadow-md"
                >
                  <LogIn size={18} /> Login
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search for dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full"
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t py-4 space-y-3">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 font-semibold">
              Home
            </Link>

            <Link to="/menu" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 font-semibold">
              Menu
            </Link>

            {user && (
              <>
                {selectedTable ? (
                  <div className="px-4 py-2">
                    <span className="text-sm font-medium text-gray-600">
                      Table {selectedTable.table_number}
                    </span>
                  </div>
                ) : (
                  <Link to="/select-table" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2">
                    Select Table
                  </Link>
                )}

                <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2">
                  Cart {cartItemCount > 0 && `(${cartItemCount})`}
                </Link>

                {user.role === "admin" && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 bg-indigo-600 text-white"
                  >
                    Admin Dashboard
                  </Link>
                )}

                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2">
                  Profile
                </Link>
              </>
            )}

            {!user && (
              <>
                <Link to="/admin/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2">
                  Admin Login
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 bg-orange-600 text-white text-center"
                >
                  Login / Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
