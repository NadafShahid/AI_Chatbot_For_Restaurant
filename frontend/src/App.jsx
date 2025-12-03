import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Categories from "./components/Categories";
import Menu from "./pages/Menu";
import ChatCTA from "./components/chatcta";
import Cart from "./pages/cart";
import Login from "./pages/login";
import Profile from "./pages/profile";
import OrderSuccess from "./pages/OrderSuccess";
import AdminLogin from "./pages/AdminLogin";
import TablesManagement from "./pages/Admintablesm";
import AdminDashboard from "./pages/AdminDashboard";
import POS from "./pages/POS";
import UserManagement from "./pages/UserManagement";
import { AuthProvider } from "./context/AuthContext";
import AdminMenuManagement from "./pages/AdminMenuManagement";
import ChatDashboard from "./pages/ChatDashboard";
import TableSelection from "./pages/TableSelection";

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Navbar />}
      
      <Routes>
        {/* Home */}
        <Route 
          path="/" 
          element={
            <>
              
              <Categories />
              
              <ChatCTA />
            </>
          } 
        />

        {/* Table Selection */}
        <Route path="/select-table" element={<TableSelection />} />

        {/* Menu */}
        <Route path="/menu" element={<Menu />} />

        {/* Cart */}
        <Route path="/cart" element={<Cart />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Profile */}
        <Route path="/profile" element={<Profile />} />

        

        {/* Order Success */} 
        <Route path="/order-success" element={<OrderSuccess />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/pos" element={<POS />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/menu" element={<AdminMenuManagement />} />
        <Route path="/admin/chats" element={<ChatDashboard />} />
        <Route path="/admin/tables" element={<TablesManagement/>} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>

      
       

   
      {!isAdminRoute && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
