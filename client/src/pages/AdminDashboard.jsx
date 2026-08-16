import { useEffect, useState } from "react";
import { getDashboardStats } from "../services/adminService";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();

      console.log("ADMIN DASHBOARD:", data);

      setStats(data.stats);
    } catch (error) {
      console.log("ADMIN DASHBOARD ERROR:", error);

      if (error.response?.status === 401) {
        alert("Please login first");
        navigate("/");
        return;
      }

      if (error.response?.status === 403) {
        alert("Admin access only");
        navigate("/home");
        return;
      }

      alert(
        error.response?.data?.message ||
        "Unable to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Loading
  // ==========================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-3xl font-bold text-blue-700">
          Loading Dashboard...
        </h1>
      </div>
    );
  }

  // ==========================
  // No Stats
  // ==========================

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl text-red-600">
          Unable to load dashboard
        </h1>
      </div>
    );
  }

  // ==========================
  // Dashboard
  // ==========================

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ==========================
          Header
      ========================== */}

      <header className="bg-blue-700 text-white px-8 py-5 shadow-md">

        <div className="max-w-7xl mx-auto flex justify-between items-center">

          <div>
            <h1 className="text-3xl font-bold">
              SkySafe ✈️
            </h1>

            <p className="text-blue-100 mt-1">
              Admin Dashboard
            </p>
          </div>

          <button
            onClick={() => navigate("/home")}
            className="bg-white text-blue-700 px-5 py-2 rounded-lg font-semibold hover:bg-gray-100"
          >
            Back to Home
          </button>

        </div>

      </header>

      {/* ==========================
          Main Content
      ========================== */}

      <main className="max-w-7xl mx-auto px-6 py-10">

        <h2 className="text-3xl font-bold text-gray-800 mb-8">
          Dashboard Overview
        </h2>

        {/* ==========================
            Statistics Cards
        ========================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Total Flights */}

          <div className="bg-white rounded-xl shadow-lg p-7">

            <p className="text-gray-500 text-lg">
              Total Flights
            </p>

            <h3 className="text-5xl font-bold text-blue-700 mt-4">
              {stats.totalFlights}
            </h3>

            <p className="text-gray-400 mt-3">
              Flights in system
            </p>

          </div>

          {/* Total Users */}

          <div className="bg-white rounded-xl shadow-lg p-7">

            <p className="text-gray-500 text-lg">
              Total Users
            </p>

            <h3 className="text-5xl font-bold text-green-600 mt-4">
              {stats.totalUsers}
            </h3>

            <p className="text-gray-400 mt-3">
              Registered users
            </p>

          </div>

          {/* Total Bookings */}

          <div className="bg-white rounded-xl shadow-lg p-7">

            <p className="text-gray-500 text-lg">
              Total Bookings
            </p>

            <h3 className="text-5xl font-bold text-purple-600 mt-4">
              {stats.totalBookings}
            </h3>

            <p className="text-gray-400 mt-3">
              All bookings
            </p>

          </div>

          {/* Revenue */}

          <div className="bg-white rounded-xl shadow-lg p-7">

            <p className="text-gray-500 text-lg">
              Total Revenue
            </p>

            <h3 className="text-4xl font-bold text-red-600 mt-4">
              ₹ {stats.revenue}
            </h3>

            <p className="text-gray-400 mt-3">
              Confirmed bookings
            </p>

          </div>

        </div>

        {/* ==========================
            Admin Actions
        ========================== */}

        <div className="mt-10 bg-white rounded-xl shadow-lg p-8">

          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Admin Actions
          </h2>

          <div className="flex flex-wrap gap-4">

            <button
              onClick={() => navigate("/home")}
              className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Manage Flights
            </button>

            <button
              onClick={() => navigate("/home")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              View Flights
            </button>

            <button
              onClick={() => navigate("/my-bookings")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              View Bookings
            </button>

          </div>

        </div>

      </main>

    </div>
  );
}

export default AdminDashboard;