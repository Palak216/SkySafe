import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-blue-700 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-4">

        {/* Logo */}
        <Link to="/" className="text-3xl font-bold">
          SkySafe ✈️
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-8">

          <Link
            to="/"
            className="hover:text-yellow-300 transition duration-300"
          >
            Home
          </Link>

          <a
            href="#search"
            className="hover:text-yellow-300 transition duration-300"
          >
            Search Flights
          </a>

          <Link
            to="/login"
            className="hover:text-yellow-300 transition duration-300"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="bg-white text-blue-700 px-5 py-2 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
          >
            Register
          </Link>

        </div>

      </div>
    </nav>
  );
}

export default Navbar;