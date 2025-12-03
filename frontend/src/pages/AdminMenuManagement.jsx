import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import AdminNavbar from "../components/AdminNavbar";

const MENU_API = "http://localhost:3001/api/menu";
const PLACEHOLDER = "https://via.placeholder.com/150x100?text=No+Image";

export default function AdminMenuManagement() {
  const navigate = useNavigate();
  const { user, authLoading, handleLogout } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    id: null,
    name: "",
    price: "",
    description: "",
    category: "",
    image_url: "",
    image: null,
    availability: true,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      navigate("/admin/login");
      return;
    }
    fetchMenu();
  }, [user, authLoading, navigate]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await axios.get(MENU_API);
      if (res.data.success) setItems(res.data.data || []);
    } catch (err) {
      console.error("Error fetching menu:", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setForm({ ...item, image: null });
    } else {
      setForm({
        id: null,
        name: "",
        price: "",
        description: "",
        category: "",
        image_url: "",
        image: null,
        availability: true,
      });
    }
    setModalOpen(true);
  };

  const saveItem = async () => {
    if (!form.name || !form.price || !form.category) {
      alert("Name, price, and category are required.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("availability", form.availability);

      if (form.image) formData.append("image", form.image);

      if (form.id) {
        await axios.put(`${MENU_API}/${form.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(MENU_API, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setModalOpen(false);
      fetchMenu();
    } catch (err) {
      alert("Error saving item");
      console.error(err);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("Delete this item?")) return;
    try {
      await axios.delete(`${MENU_API}/${id}`);
      fetchMenu();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await axios.put(`${MENU_API}/${item.id}`, {
        ...item,
        availability: !item.availability,
      });
      fetchMenu();
    } catch {
      alert("Error updating availability");
    }
  };

  if (loading) return <p className="p-6 text-center">Loading menu...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar onLogout={handleLogout} />

      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>

        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-6 hover:bg-blue-700"
        >
          + Add New Item
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white shadow p-4 rounded-lg border hover:shadow-lg transition"
            >
              <img
                src={item.image_url || PLACEHOLDER}
                alt={item.name}
                className="w-full h-32 object-cover rounded mb-3"
              />
              <h3 className="font-bold text-lg">{item.name}</h3>
              <p className="text-gray-600">₹{item.price}</p>
              <p className="text-sm text-gray-500 mb-2">{item.description}</p>
              <p className="text-sm font-semibold mb-1">
                Category: <span className="text-blue-700">{item.category}</span>
              </p>
              <p
                className={`text-sm font-bold mb-3 ${
                  item.availability ? "text-green-600" : "text-red-600"
                }`}
              >
                {item.availability ? "Available" : "Unavailable"}
              </p>

              <div className="flex justify-between">
                <button
                  onClick={() => openModal(item)}
                  className="text-white bg-yellow-500 px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>

                <button
                  onClick={() => toggleAvailability(item)}
                  className={`px-3 py-1 rounded text-white ${
                    item.availability ? "bg-red-600" : "bg-green-600"
                  }`}
                >
                  {item.availability ? "Disable" : "Enable"}
                </button>

                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-white bg-red-600 px-3 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4">
                {form.id ? "Edit Item" : "Add New Item"}
              </h2>

              <div className="space-y-4">
                {form.image ? (
                  <img
                    src={URL.createObjectURL(form.image)}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                ) : form.image_url ? (
                  <img
                    src={form.image_url}
                    alt="Current"
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                ) : (
                  <img
                    src={PLACEHOLDER}
                    alt="No Image"
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                )}

                <div className="space-y-4">
  <input
    type="text"
    placeholder="Name"
    className="w-full border-2 border-gray-200 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
    value={form.name}
    onChange={(e) => setForm({ ...form, name: e.target.value })}
  />

  <input
    type="number"
    placeholder="Price"
    className="w-full border-2 border-gray-200 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
    value={form.price}
    onChange={(e) => setForm({ ...form, price: e.target.value })}
  />

  <input
    type="text"
    placeholder="Category"
    className="w-full border-2 border-gray-200 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
    value={form.category}
    onChange={(e) => setForm({ ...form, category: e.target.value })}
  />

  <textarea
    placeholder="Description"
    className="w-full border-2 border-gray-200 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 transition resize-none"
    value={form.description}
    onChange={(e) => setForm({ ...form, description: e.target.value })}
  ></textarea>

  <input
    type="file"
    accept="image/*"
    className="w-full border-2 border-gray-200 rounded-2xl p-2 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
    onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
  />

  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={form.availability}
      onChange={(e) => setForm({ ...form, availability: e.target.checked })}
      className="accent-orange-500"
    />
    <label className="font-medium text-gray-700">Available</label>
  </div>

  <div className="flex justify-end gap-4 mt-4">
    <button
      onClick={() => setModalOpen(false)}
      className="px-6 py-3 border rounded-2xl hover:bg-gray-100 transition"
    >
      Cancel
    </button>
    <button
      onClick={saveItem}
      className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl shadow-md transition transform hover:scale-105"
    >
      Save
    </button>
  </div>
</div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
