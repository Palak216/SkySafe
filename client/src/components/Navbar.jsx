import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { logoutUser } from "../services/authService";

function Navbar() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const data = await logoutUser();

      alert(data.message);

      setUser(null);

      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);

      // Even if backend logout fails,
      // remove user from frontend
      setUser(null);
      navigate("/");
    }
  };

  return (
    <nav className="bg-blue-700 text-white px-8 py-4 flex justify-between items-center shadow-md">

      {/* Logo */}
      <Link
        to="/home"
        className="text-2xl font-bold"
      >
        SkySafe ✈️
      </Link>

      {/* Navigation */}
      <div className="flex items-center gap-6">

        {user ? (
          <>
            <Link
              to="/home"
              className="hover:text-blue-200"
            >
              Home
            </Link>

            <a
              href="/home#search"
              className="hover:text-blue-200"
            >
              Search Flights
            </a>

            <Link
              to="/my-bookings"
              className="hover:text-blue-200"
            >
              My Bookings
            </Link>

            {/* Admin link */}
            {user.role === "admin" && (
              <Link
                to="/admin"
                className="hover:text-blue-200"
              >
                Admin
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/"
              className="hover:text-blue-200"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="hover:text-blue-200"
            >
              Register
            </Link>
          </>
        )}

      </div>
    </nav>
  );
}

export default Navbar;