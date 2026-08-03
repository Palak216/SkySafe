import { useEffect, useState } from "react";
import { getDashboardStats } from "../services/adminService";

function AdminDashboard() {

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data.stats);
    } catch (error) {
      console.log(error);
      alert("Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <h1 className="text-center mt-20 text-3xl">
        Loading Dashboard...
      </h1>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">

      <h1 className="text-4xl font-bold text-blue-700 mb-10">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

        <div className="bg-white shadow-lg rounded-xl p-8">
          <h2 className="text-gray-500 text-lg">
            Total Flights
          </h2>

          <h1 className="text-5xl font-bold text-blue-700 mt-4">
            {stats.totalFlights}
          </h1>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-8">
          <h2 className="text-gray-500 text-lg">
            Total Users
          </h2>

          <h1 className="text-5xl font-bold text-green-600 mt-4">
            {stats.totalUsers}
          </h1>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-8">
          <h2 className="text-gray-500 text-lg">
            Total Bookings
          </h2>

          <h1 className="text-5xl font-bold text-purple-600 mt-4">
            {stats.totalBookings}
          </h1>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-8">
          <h2 className="text-gray-500 text-lg">
            Revenue
          </h2>

          <h1 className="text-4xl font-bold text-red-600 mt-4">
            ₹ {stats.revenue}
          </h1>
        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;