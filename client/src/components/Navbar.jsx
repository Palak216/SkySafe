function Navbar() {
  return (
    <nav className="bg-blue-700 text-white px-8 py-4 flex justify-between items-center shadow-md">
      <h1 className="text-2xl font-bold">
        SkySafe ✈️
      </h1>

      <div className="flex gap-6">
        <button className="hover:text-yellow-300">
          Home
        </button>
         <button className="hover:text-yellow-300">
          Search Flights
        </button>
        <button className="hover:text-yellow-300">
          My Bookings
        </button>

        <button className="hover:text-yellow-300">
          Login
        </button>

        <button className="hover:text-yellow-300">
          Register
        </button>
      </div>
    </nav>
  );
}

export default Navbar;