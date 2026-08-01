import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-blue-700 text-white px-8 py-4 flex justify-between items-center shadow-md">

      <Link
        to="/home"
        className="text-2xl font-bold"
      >
        SkySafe ✈️
      </Link>

      <div className="flex gap-6">

        <Link
          to="/home"
          className="hover:text-yellow-300"
        >
          Home
        </Link>

        <a
          href="#search"
          className="hover:text-yellow-300"
        >
          Search Flights
        </a>

        <Link
          to="/booking"
          className="hover:text-yellow-300"
        >
          My Bookings
        </Link>

        <Link
          to="/"
          className="hover:text-yellow-300"
        >
          Login
        </Link>

        <Link
          to="/register"
          className="hover:text-yellow-300"
        >
          Register
        </Link>

      </div>

    </nav>
  );
}

export default Navbar;