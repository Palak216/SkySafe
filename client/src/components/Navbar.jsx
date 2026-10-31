import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-blue-700 text-white px-6 sm:px-8 py-4 flex justify-between items-center shadow-md">
      {/* Logo */}
      <Link to="/" className="text-2xl font-black tracking-tight flex items-center gap-2">
        <span>SkySafe</span>
        <span>✈️</span>
      </Link>

      {/* Navigation */}
      <div className="flex items-center gap-4 sm:gap-6 text-sm font-semibold">
        <Link to="/" className="hover:text-blue-200 transition">
          Home
        </Link>

        <Link to="/search" className="hover:text-blue-200 transition">
          Browse Flights
        </Link>

        {user ? (
          <>
            <Link to="/my-bookings" className="hover:text-blue-200 transition">
              My Bookings
            </Link>

            {user.role === "admin" && (
              <Link
                to="/admin"
                className="bg-blue-800 hover:bg-blue-900 px-3 py-1.5 rounded-lg border border-blue-400 text-xs font-bold transition"
              >
                Admin Panel
              </Link>
            )}

            <div className="flex items-center gap-3 pl-2 border-l border-blue-500">
              <span className="text-xs text-blue-200 hidden md:inline">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hover:text-blue-200 transition px-2 py-1"
            >
              Log In
            </Link>

            <Link
              to="/register"
              className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
