import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import QrScanner from "qr-scanner";
import { MapPin } from "lucide-react";

export default function TableSelection() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [qrScanner, setQrScanner] = useState(null);
  const videoRef = useRef(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadTables();

    const storedTable = localStorage.getItem("selectedTable");
    if (storedTable && user && user.role !== "admin") {
      navigate("/menu");
    }
  }, [user, navigate]);

  const loadTables = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/tables");
      const data = await response.json();

      if (data.success) setTables(data.data);
      else setError("Failed to load tables");
    } catch {
      setError("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (tableId) => {
    setError(null);

    const table = tables.find((t) => t.id === tableId);

    if (!table) {
      setError("Invalid table QR");
      return;
    }

    if (table.is_occupied) {
      setError("This table is currently occupied.");
      return;
    }

    setSelectedTable(table);
    localStorage.setItem("selectedTable", JSON.stringify(table));

    stopScanning();

    setTimeout(() => navigate("/menu"), 1000);
  };

  const startScanning = async () => {
    setError(null);
    setScanning(true);

    await new Promise((r) => setTimeout(r, 100)); // Wait for video to mount

    if (!videoRef.current) {
      setError("Camera not available.");
      return;
    }

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        const scannedValue = result.data;
        const match = scannedValue.match(/\/select-table\/(\d+)/);
        if (!match) {
          setError("Invalid QR format. Must be: /select-table/:ID");
          return;
        }
        handleQRScan(parseInt(match[1], 10));
      },
      { highlightScanRegion: true, highlightCodeOutline: true }
    );

    setQrScanner(scanner);
    scanner.start().catch(() => {
      setError("Camera permission denied.");
      setScanning(false);
    });
  };

  const stopScanning = () => {
    if (qrScanner) {
      qrScanner.stop();
      qrScanner.destroy();
      setQrScanner(null);
    }
    setScanning(false);
  };

  const handleManualSelect = (table) => {
    if (table.is_occupied) {
      setError("This table is occupied.");
      return;
    }

    setSelectedTable(table);
    localStorage.setItem("selectedTable", JSON.stringify(table));

    setTimeout(() => navigate("/menu"), 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-xl">
        Loading tables...
      </div>
    );
  }

  return (
    <div className=" bg-liner-gradientto-br from-orange-50 via-white to-yellow-50 p-6">
      <h1 className="text-4xl font-bold text-center mb-8">Select Your Table</h1>

      {/* QR Scanner Section */}
      <div className="bg-white rounded-2xl shadow-lg max-w-lg mx-auto p-6 mb-8">
        <h2 className="text-2xl font-semibold text-center mb-4">QR Code Scanner</h2>

        <video
          ref={videoRef}
          className={`w-full h-64 bg-black rounded-xl ${!scanning ? "hidden" : ""}`}
          playsInline
          muted
        />

        {!scanning && (
          <p className="text-center text-gray-500 py-4">
            Click “Start Scanning” to use camera
          </p>
        )}

        <button
          onClick={!scanning ? startScanning : stopScanning}
          className={`w-full mt-4 py-3 rounded-full text-white font-bold transition transform hover:scale-105 ${
            scanning ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {scanning ? "Stop Scanning" : "Start QR Scan"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-2xl shadow-md max-w-lg mx-auto mb-6 text-center">
          {error}
        </div>
      )}

     
    </div>

    
  );
}
