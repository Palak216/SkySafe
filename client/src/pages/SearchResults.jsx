import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { searchFlights } from "../services/flightService";

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [flights, setFlights] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const sortBy = searchParams.get("sortBy") || "price";
  const order = searchParams.get("order") || "asc";
  const airline = searchParams.get("airline") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  useEffect(() => {
    fetchResults();
  }, [searchParams]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const params = {
        from: from || undefined,
        to: to || undefined,
        date: date || undefined,
        page,
        limit: 10,
        sortBy,
        order,
        airline: airline || undefined,
        maxPrice: maxPrice || undefined,
      };

      const data = await searchFlights(params);
      setFlights(data.flights || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: data.flights?.length || 0 });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to load flights");
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set("page", "1"); // reset page on filter change
    setSearchParams(next);
  };

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", newPage.toString());
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Search Header Banner */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold text-blue-700">{from || "ANY"}</span>
              <span className="text-gray-400 text-2xl font-light">✈️</span>
              <span className="text-3xl font-extrabold text-blue-700">{to || "ANY"}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {date ? `Departing: ${new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}` : "All departure dates"} • {pagination.total} Flights Available
            </p>
          </div>

          <button
            onClick={() => navigate("/home")}
            className="self-start md:self-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Modify Search
          </button>
        </div>

        {/* Layout: Sidebar Filters + Flight List */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base">Filters</h3>
              <button
                onClick={() => setSearchParams({ from, to, date })}
                className="text-xs text-blue-600 hover:underline"
              >
                Reset All
              </button>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Sort By
              </label>
              <select
                value={`${sortBy}_${order}`}
                onChange={(e) => {
                  const [s, o] = e.target.value.split("_");
                  const next = new URLSearchParams(searchParams);
                  next.set("sortBy", s);
                  next.set("order", o);
                  setSearchParams(next);
                }}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="departureTime_asc">Departure: Earliest</option>
                <option value="departureTime_desc">Departure: Latest</option>
              </select>
            </div>

            {/* Airline Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Airline
              </label>
              <select
                value={airline}
                onChange={(e) => handleFilterChange("airline", e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Airlines</option>
                <option value="IndiGo">IndiGo</option>
                <option value="Air India">Air India</option>
                <option value="Vistara">Vistara</option>
                <option value="SpiceJet">SpiceJet</option>
                <option value="Akasa Air">Akasa Air</option>
              </select>
            </div>

            {/* Max Price Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Max Price: ₹{maxPrice || "Any"}
              </label>
              <input
                type="range"
                min="2000"
                max="15000"
                step="500"
                value={maxPrice || "15000"}
                onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>₹2,000</span>
                <span>₹15,000+</span>
              </div>
            </div>
          </aside>

          {/* Results List */}
          <section className="lg:col-span-3 space-y-4">
            {loading ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 font-medium">Searching best available flights...</p>
              </div>
            ) : errorMessage ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
                <p className="font-semibold text-lg">{errorMessage}</p>
                <button
                  onClick={fetchResults}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition"
                >
                  Retry Search
                </button>
              </div>
            ) : flights.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                <span className="text-5xl">✈️</span>
                <h3 className="text-xl font-bold text-gray-800 mt-4">No Flights Found</h3>
                <p className="text-gray-500 mt-1 max-w-md mx-auto">
                  We couldn't find any flights matching your criteria. Try adjusting your dates or clearing filters.
                </p>
                <button
                  onClick={() => setSearchParams({})}
                  className="mt-6 bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition"
                >
                  Show All Scheduled Flights
                </button>
              </div>
            ) : (
              <>
                {flights.map((flight) => {
                  const depDate = new Date(flight.departureTime);
                  const arrDate = new Date(flight.arrivalTime);
                  const isSoldOut = flight.availableSeats <= 0;

                  return (
                    <div
                      key={flight._id}
                      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      {/* Airline info */}
                      <div className="flex items-center gap-4 min-w-[180px]">
                        <div className="w-12 h-12 bg-blue-50 text-blue-700 font-bold rounded-lg flex items-center justify-center text-lg shadow-sm">
                          {flight.airline?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">{flight.airline}</h4>
                          <span className="text-xs text-gray-500 font-mono">{flight.flightNumber}</span>
                          <div className="text-[11px] text-gray-400 mt-0.5">{flight.aircraft}</div>
                        </div>
                      </div>

                      {/* Route & Timing Schedule */}
                      <div className="flex-1 flex items-center justify-between max-w-sm">
                        <div className="text-center">
                          <p className="text-xl font-extrabold text-gray-900">
                            {depDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="text-sm font-bold text-blue-700">{flight.origin}</p>
                          <p className="text-[11px] text-gray-400">
                            {depDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        </div>

                        <div className="flex flex-col items-center px-4">
                          <span className="text-xs text-gray-400 font-medium">{flight.duration}</span>
                          <div className="w-24 h-0.5 bg-gray-300 relative my-1">
                            <span className="absolute -top-2 right-1/2 translate-x-1/2 text-xs">✈</span>
                          </div>
                          <span className="text-[11px] text-green-600 font-semibold">Non-stop</span>
                        </div>

                        <div className="text-center">
                          <p className="text-xl font-extrabold text-gray-900">
                            {arrDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="text-sm font-bold text-blue-700">{flight.destination}</p>
                          <p className="text-[11px] text-gray-400">
                            {arrDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="text-right flex md:flex-col justify-between items-center md:items-end min-w-[140px] pt-4 md:pt-0 border-t md:border-t-0">
                        <div>
                          <p className="text-xs text-gray-400">Starting from</p>
                          <p className="text-2xl font-black text-gray-900">₹{flight.price.toLocaleString("en-IN")}</p>
                          <p className="text-xs text-green-600 font-medium">
                            {flight.availableSeats} seats left
                          </p>
                        </div>

                        <button
                          disabled={isSoldOut}
                          onClick={() => navigate(`/booking/${flight._id}`)}
                          className={`mt-3 px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition ${
                            isSoldOut
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {isSoldOut ? "Sold Out" : "Book Flight"}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-200 mt-6 shadow-sm">
                    <button
                      disabled={!pagination.hasPrevPage}
                      onClick={() => handlePageChange(pagination.page - 1)}
                      className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      &larr; Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page <strong className="text-gray-900">{pagination.page}</strong> of{" "}
                      <strong className="text-gray-900">{pagination.totalPages}</strong>
                    </span>
                    <button
                      disabled={!pagination.hasNextPage}
                      onClick={() => handlePageChange(pagination.page + 1)}
                      className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next &rarr;
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default SearchResults;
