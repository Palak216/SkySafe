import { useState } from "react";
import { searchFlights } from "../services/flightService";
import { useNavigate } from "react-router-dom";
function SearchForm() {
  // ============================
  // State Variables
  // ============================

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(1);

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ============================
  // Search Flights
  // ============================

  const handleSearch = async () => {
    try {
      setLoading(true);

      console.log("Searching...");
      console.log({
        source,
        destination,
        date,
        passengers,
      });

      const data = await searchFlights({
        source,
        destination,
        date,
      });

      console.log("API Response:", data);

      setFlights(data.flights);

    } catch (error) {
      console.log(error);

      alert("Unable to fetch flights");
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Book Flight
  // ============================

  const handleBookNow = (flightId) => {
  navigate(`/booking/${flightId}`);
};

    // Later we will navigate here
    // navigate(`/booking/${flightId}`);
  

  return (
    <section
      id="search"
      className="py-20 bg-white"
    >
      <div className="max-w-6xl mx-auto px-5">

        {/* Heading */}

        <h2 className="text-4xl font-bold text-center text-blue-700 mb-12">
          Search Flights
        </h2>

        {/* Search Form */}

        <div className="bg-sky-50 rounded-xl shadow-xl p-10">

          <div className="grid md:grid-cols-2 gap-8">

            {/* Source */}

            <div>

              <label className="block font-semibold mb-2">
                From
              </label>

              <input
                type="text"
                placeholder="Delhi"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* Destination */}

            <div>

              <label className="block font-semibold mb-2">
                To
              </label>

              <input
                type="text"
                placeholder="Mumbai"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* Date */}

            <div>

              <label className="block font-semibold mb-2">
                Departure Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* Passengers */}

            <div>

              <label className="block font-semibold mb-2">
                Passengers
              </label>

              <select
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-full border rounded-lg p-3"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>

            </div>

          </div>

          {/* Search Button */}

          <div className="text-center mt-10">

            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 text-white px-10 py-3 rounded-lg transition"
            >
              {loading ? "Searching..." : "Search Flights"}
            </button>

          </div>

        </div>

        {/* Flight Results */}

        <div className="mt-12">

          {flights.length === 0 ? (

            <p className="text-center text-gray-500">
              Search for flights to see available flights.
            </p>

          ) : (

            flights.map((flight) => (

              <div
                key={flight._id}
                className="bg-white border rounded-xl shadow-lg p-6 mb-5"
              >

                <div className="flex justify-between items-center">

                  {/* Left Side */}

                  <div>

                    <h3 className="text-2xl font-bold text-blue-700">
                      {flight.airline}
                    </h3>

                    <p className="mt-2">
                      <strong>Flight:</strong> {flight.flightNumber}
                    </p>

                    <p>
                      <strong>Route:</strong> {flight.source} → {flight.destination}
                    </p>

                    <p>
                      <strong>Departure:</strong>{" "}
                      {new Date(flight.departureTime).toLocaleString()}
                    </p>

                    <p>
                      <strong>Arrival:</strong>{" "}
                      {new Date(flight.arrivalTime).toLocaleString()}
                    </p>

                    <p>
                      <strong>Duration:</strong> {flight.duration}
                    </p>

                  </div>

                  {/* Right Side */}

                  <div className="text-right">

                    <h2 className="text-3xl font-bold text-green-600">
                      ₹{flight.price}
                    </h2>

                    <p className="mt-2">
                      Seats Left: {flight.availableSeats}
                    </p>

                    <button
                      onClick={() => handleBookNow(flight._id)}
                      className="mt-5 bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg transition"
                    >
                      Book Now
                    </button>

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      </div>
    </section>
  );
}

export default SearchForm;