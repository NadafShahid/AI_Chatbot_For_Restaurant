import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminNavbar from "../components/AdminNavbar";
import QRCode from "qrcode";

const TABLES_API = "http://localhost:3001/api/tables";

export default function TablesManagement() {
  const navigate = useNavigate();
  const { user, authLoading, handleLogout } = useAuth();

  const [tables, setTables] = useState([]);
  const [qrCodes, setQrCodes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      navigate("/admin/login");
      return;
    }
    fetchTables();
  }, [user, authLoading, navigate]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await axios.get(TABLES_API);
      if (res.data.success) {
        setTables(res.data.data || []);
        generateQRCodes(res.data.data || []);
      } else {
        setError("Failed to fetch tables");
      }
    } catch (err) {
      setError("Error fetching tables: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate QR code data URLs for each table
  const generateQRCodes = async (tables) => {
    const qrMap = {};
    for (let table of tables) {
      const url = `http://localhost:5173/select-table/${table.id}`;
      qrMap[table.id] = await QRCode.toDataURL(url);
    }
    setQrCodes(qrMap);
  };

  const updateTableStatus = async (table) => {
    try {
      await axios.put(`${TABLES_API}/${table.id}`, {
        ...table,
        is_occupied: !table.is_occupied,
      });
      fetchTables();
    } catch (err) {
      console.error("Error updating table status:", err);
      alert("Failed to update table status");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar onLogout={handleLogout} />

      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Tables Management</h1>

        {loading && <p>Loading tables...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && tables.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                className="p-4 bg-white shadow rounded flex flex-col items-center"
              >
                <p className="font-semibold mb-1">Table Number: {table.table_number}</p>
                <p className="mb-1">Seats: {table.seats}</p>
                <p className="mb-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      table.is_occupied ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {table.is_occupied ? "Occupied" : "Available"}
                  </span>
                </p>

                {/* QR Code Image */}
                {qrCodes[table.id] && (
                  <img src={qrCodes[table.id]} alt={`QR for table ${table.table_number}`} className="mb-2 w-32 h-32" />
                )}

                <button
                  onClick={() => updateTableStatus(table)}
                  className={`mt-2 px-3 py-1 rounded text-white ${
                    table.is_occupied ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {table.is_occupied ? "Mark as Available" : "Mark as Occupied"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
