import { useState } from "react";
import { searchFlights } from "../services/flightService";

function SearchForm() {
  // Input States
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(1);

  // Flights returned from backend
  const [flights, setFlights] = useState([]);

  // Loading State
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
  try {
    setLoading(true);

    console.log("Searching...");
    console.log("Source:", source);
    console.log("Destination:", destination);
    console.log("Date:", date);

    const data = await searchFlights({
      source,
      destination,
      date,
    });

    console.log("API Response:", data);

    setFlights(data.flights);

  } catch (error) {
    console.log("FULL ERROR:", error);

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Response:", error.response.data);
    }

    if (error.request) {
      console.log("Request:", error.request);
    }

    console.log("Message:", error.message);

    alert("Unable to fetch flights.");
  } finally {
    setLoading(false);
  }
};

  return (
    <section
      id="search"
      className="py-20 bg-white"
    >
      <div className="max-w-5xl mx-auto">

        {/* Heading */}
        <h2 className="text-4xl font-bold text-center text-blue-700 mb-12">
          Search Flights
        </h2>

        {/* Search Box */}
        <div className="bg-sky-50 rounded-xl shadow-xl p-10">

          <div className="grid grid-cols-2 gap-8">

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
                className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Departure Date */}
            <div>
              <label className="block font-semibold mb-2">
                Departure Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
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
              className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-lg transition duration-300"
            >
              {loading ? "Searching..." : "Search Flights"}
            </button>
          </div>

        </div>

        {/* Flight Results */}
        <div className="mt-12">

          {flights.length > 0 ? (

            flights.map((flight) => (

              <div
                key={flight._id}
                className="bg-white shadow-lg rounded-xl p-6 mb-5 border"
              >

                <div className="flex justify-between items-center">

                  <div>
                    <h3 className="text-2xl font-bold text-blue-700">
                      {flight.airline}
                    </h3>

                    <p className="mt-2">
                      <strong>Route:</strong> {flight.source} → {flight.destination}
                    </p>

                    <p>
                      <strong>Departure:</strong> {new Date(flight.departureTime).toLocaleString()}
                    </p>

                    <p>
                      <strong>Arrival:</strong> {new Date(flight.arrivalTime).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">

                    <p className="text-3xl font-bold text-green-600">
                      ₹ {flight.price}
                    </p>

                    <p className="mt-2">
                      Seats Left: {flight.availableSeats}
                    </p>

                    <button className="mt-4 bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg">
                      Book Now
                    </button>

                  </div>

                </div>

              </div>

            ))

          ) : (

            <p className="text-center text-gray-500 mt-10">
              Search for flights to see available flights.
            </p>

          )}

        </div>

      </div>
    </section>
  );
}

export default SearchForm;