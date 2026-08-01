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

      console.log(error);

    }

  };

  return (

    <nav className="bg-blue-700 text-white px-8 py-4 flex justify-between items-center shadow-md">

      <Link
        to="/home"
        className="text-2xl font-bold"
      >
        SkySafe ✈️
      </Link>

      <div className="flex gap-6">

        {user ? (

          <>
            <Link to="/home">
              Home
            </Link>

            <a href="#search">
              Search Flights
            </a>

            <Link to="/my-bookings">
              My Bookings
            </Link>

            <button
              onClick={handleLogout}
            >
              Logout
            </button>

          </>

        ) : (

          <>

            <Link to="/">
              Login
            </Link>

            <Link to="/register">
              Register
            </Link>

          </>

        )}

      </div>

    </nav>

  );

}

export default Navbar;