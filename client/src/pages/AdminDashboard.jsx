import { useEffect, useState } from "react";
import { getDashboardStats } from "../services/adminService";
import Navbar from "../components/Navbar";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();

      console.log("ADMIN DASHBOARD:", data);

      setStats(data.stats);
    } catch (error) {
      console.log("Dashboard Error:", error);

      alert(
        error.response?.data?.message ||
        "Unable to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Loading
  // ==============================

  if (loading) {
    return (
      <>
        <Navbar />

        <h1 className="text-center mt-20 text-3xl">
          Loading Dashboard...
        </h1>
      </>
    );
  }

  // ==============================
  // Dashboard
  // ==============================

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-100 p-10">

        {/* Header */}

        <div className="max-w-7xl mx-auto">

          <h1 className="text-4xl font-bold text-blue-700 mb-2">
            Admin Dashboard
          </h1>

          <p className="text-gray-500 mb-10">
            Manage SkySafe flights, users and bookings
          </p>


          {/* ==============================
              Statistics
          ============================== */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Flights */}

            <div className="bg-white shadow-lg rounded-xl p-7">

              <p className="text-gray-500 text-lg">
                Total Flights
              </p>

              <h2 className="text-5xl font-bold text-blue-700 mt-4">
                {stats?.totalFlights || 0}
              </h2>

            </div>


            {/* Users */}

            <div className="bg-white shadow-lg rounded-xl p-7">

              <p className="text-gray-500 text-lg">
                Total Users
              </p>

              <h2 className="text-5xl font-bold text-green-600 mt-4">
                {stats?.totalUsers || 0}
              </h2>

            </div>


            {/* Bookings */}

            <div className="bg-white shadow-lg rounded-xl p-7">

              <p className="text-gray-500 text-lg">
                Total Bookings
              </p>

              <h2 className="text-5xl font-bold text-purple-600 mt-4">
                {stats?.totalBookings || 0}
              </h2>

            </div>


            {/* Revenue */}

            <div className="bg-white shadow-lg rounded-xl p-7">

              <p className="text-gray-500 text-lg">
                Revenue
              </p>

              <h2 className="text-4xl font-bold text-red-600 mt-4">
                ₹ {stats?.revenue || 0}
              </h2>

            </div>

          </div>


          {/* ==============================
              Admin Actions
          ============================== */}

          <div className="mt-12">

            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Management
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">


              {/* Flight Management */}

              <div className="bg-white shadow-lg rounded-xl p-7">

                <h3 className="text-2xl font-bold text-blue-700">
                  Flight Management
                </h3>

                <p className="text-gray-500 mt-2">
                  Add, update and remove flights.
                </p>

                <button
                  className="mt-6 bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg"
                >
                  Manage Flights
                </button>

              </div>


              {/* User Management */}

              <div className="bg-white shadow-lg rounded-xl p-7">

                <h3 className="text-2xl font-bold text-green-600">
                  User Management
                </h3>

                <p className="text-gray-500 mt-2">
                  View registered SkySafe users.
                </p>

                <button
                  className="mt-6 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg"
                >
                  Manage Users
                </button>

              </div>


              {/* Booking Management */}

              <div className="bg-white shadow-lg rounded-xl p-7">

                <h3 className="text-2xl font-bold text-purple-600">
                  Booking Management
                </h3>

                <p className="text-gray-500 mt-2">
                  View and manage all bookings.
                </p>

                <button
                  className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-lg"
                >
                  Manage Bookings
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}

export default AdminDashboard;