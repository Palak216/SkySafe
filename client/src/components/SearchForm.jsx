import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchFlights } from "../services/flightService";
import { searchFlightsAI, prepareFlightForBooking } from "../services/aiFlightService";

function SearchForm() {
  const navigate = useNavigate();

  // Search Mode: "ai" (Natural Language) or "traditional" (Manual fields)
  const [searchMode, setSearchMode] = useState("ai");

  // AI Search State
  const [aiPrompt, setAiPrompt] = useState("");
  const [parsedQuery, setParsedQuery] = useState(null);
  const [providerInfo, setProviderInfo] = useState(null);

  // Traditional Search State
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(1);

  // Results & Loading State
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoadingId, setBookingLoadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Quick suggestion chips for interview/demo
  const QUICK_PROMPTS = [
    "Find me a cheap non-stop flight from Delhi to Goa tomorrow morning",
    "Cheapest flight from Mumbai to Delhi on October 5",
    "Show me non-stop flights from Bangalore to Delhi after 6 PM",
    "Find an affordable morning flight from Chennai to Mumbai for 2 adults",
  ];

  // ============================
  // Handle AI Search
  // ============================
  const handleAiSearch = async (queryText) => {
    const textToSearch = queryText || aiPrompt;
    if (!textToSearch.trim()) {
      setErrorMessage("Please enter what flight you are looking for.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setHasSearched(true);

      const data = await searchFlightsAI(textToSearch);

      if (data.success) {
        setFlights(data.flights || []);
        setParsedQuery(data.query || null);
        setProviderInfo({
          provider: data.provider,
          isFallback: data.isFallback,
          fallbackReason: data.fallbackReason,
        });
      }
    } catch (error) {
      console.error("AI Search Error:", error);
      const msg = error.response?.data?.message || "Unable to search flights. Please try again.";
      setErrorMessage(msg);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Handle Traditional Search
  // ============================
  const handleTraditionalSearch = async () => {
    if (!source || !destination) {
      setErrorMessage("Please provide both origin and destination.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setHasSearched(true);
      setParsedQuery(null);
      setProviderInfo(null);

      const data = await searchFlights({
        source,
        destination,
        date,
      });

      setFlights(data.flights || []);
    } catch (error) {
      console.error("Traditional Search Error:", error);
      setErrorMessage(error.response?.data?.message || "Unable to fetch flights");
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Handle Booking Selection (Bridge)
  // ============================
  const handleBookNow = async (flight) => {
    try {
      setBookingLoadingId(flight.id || flight._id);

      // If flight already has a standard MongoDB _id and no external sourceProvider
      if (flight._id && !flight.sourceProvider) {
        navigate(`/booking/${flight._id}`);
        return;
      }

      // External / Mock flight offer: Bridge safely into SkySafe's MongoDB inventory
      const data = await prepareFlightForBooking(flight);

      if (data.success && data.flightId) {
        navigate(`/booking/${data.flightId}`);
      } else {
        alert("Failed to prepare flight for booking. Please try again.");
      }
    } catch (error) {
      console.error("Booking Bridge Error:", error);
      alert(error.response?.data?.message || "Error preparing flight for booking");
    } finally {
      setBookingLoadingId(null);
    }
  };

  return (
    <section id="search" className="py-16 bg-slate-50 min-h-[600px]">
      <div className="max-w-6xl mx-auto px-5">

        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-blue-800">
            Find Your Next Flight
          </h2>
          <p className="text-gray-600 mt-2 text-lg">
            Search naturally with AI or use traditional route filters
          </p>
        </div>

        {/* Search Mode Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1.5 rounded-xl shadow-md border border-gray-200 inline-flex">
            <button
              onClick={() => {
                setSearchMode("ai");
                setErrorMessage("");
              }}
              className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                searchMode === "ai"
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-gray-600 hover:text-blue-700"
              }`}
            >
              <span>✨ Ask SkySafe (AI Search)</span>
            </button>

            <button
              onClick={() => {
                setSearchMode("traditional");
                setErrorMessage("");
              }}
              className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                searchMode === "traditional"
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-gray-600 hover:text-blue-700"
              }`}
            >
              <span>🔍 Traditional Search</span>
            </button>
          </div>
        </div>

        {/* Main Search Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8 md:p-10 transition-all">

          {/* =========================================================
              AI SEARCH MODE
          ========================================================== */}
          {searchMode === "ai" ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Type your travel request in natural language:
                </label>
                <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2.5 py-1 rounded-full">
                  Powered by NLP & Amadeus API
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Find me a cheap non-stop flight from Delhi to Goa tomorrow morning"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAiSearch();
                  }}
                  className="w-full border-2 border-blue-200 rounded-xl p-4 pr-32 text-gray-800 text-lg placeholder-gray-400 focus:outline-none focus:border-blue-600 shadow-sm"
                />

                <button
                  onClick={() => handleAiSearch()}
                  disabled={loading}
                  className="absolute right-2 top-2 bottom-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 rounded-lg transition disabled:bg-blue-300 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <span>Search</span>
                  )}
                </button>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="mt-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Try these example requests:
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((promptText, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAiPrompt(promptText);
                        handleAiSearch(promptText);
                      }}
                      className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 transition"
                    >
                      💡 {promptText}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* =========================================================
                TRADITIONAL SEARCH MODE
            ========================================================== */
            <div>
              <div className="grid md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    From (Origin)
                  </label>
                  <input
                    type="text"
                    placeholder="Delhi or DEL"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full border rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    To (Destination)
                  </label>
                  <input
                    type="text"
                    placeholder="Mumbai or BOM"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full border rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Passengers
                  </label>
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="w-full border rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "Passenger" : "Passengers"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={handleTraditionalSearch}
                  disabled={loading}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-10 py-3 rounded-lg transition disabled:bg-blue-300"
                >
                  {loading ? "Searching Flights..." : "Search Flights"}
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-center">
                <span className="text-red-500 text-xl mr-3">⚠️</span>
                <p className="text-red-700 font-medium text-sm">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* =========================================================
              PARSED AI QUERY SUMMARY
          ========================================================== */}
          {parsedQuery && (
            <div className="mt-8 bg-blue-50/70 border border-blue-200 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🎯</span> Extracted Travel Parameters
                </span>

                {providerInfo && (
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      providerInfo.provider === "amadeus"
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {providerInfo.provider === "amadeus"
                      ? "⚡ Live Amadeus Test API"
                      : "🛡️ SkySafe Mock Engine (Fallback)"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block text-xs">Route:</span>
                  <strong className="text-gray-800">
                    {parsedQuery.originCity} ({parsedQuery.origin}) → {parsedQuery.destinationCity} ({parsedQuery.destination})
                  </strong>
                </div>

                <div>
                  <span className="text-gray-500 block text-xs">Date:</span>
                  <strong className="text-gray-800">
                    {parsedQuery.departureDate}{" "}
                    {parsedQuery.dateInferred && (
                      <span className="text-xs text-blue-600 font-normal">(Defaulted to tomorrow)</span>
                    )}
                  </strong>
                </div>

                <div>
                  <span className="text-gray-500 block text-xs">Passengers:</span>
                  <strong className="text-gray-800">
                    {parsedQuery.adults} {parsedQuery.adults === 1 ? "Adult" : "Adults"}
                  </strong>
                </div>

                <div>
                  <span className="text-gray-500 block text-xs">Preferences:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {parsedQuery.nonStop && (
                      <span className="bg-blue-200 text-blue-800 text-[11px] px-2 py-0.5 rounded font-medium">
                        Non-stop
                      </span>
                    )}
                    {parsedQuery.timePreference && (
                      <span className="bg-purple-100 text-purple-800 text-[11px] px-2 py-0.5 rounded font-medium">
                        {parsedQuery.timePreference}
                      </span>
                    )}
                    {parsedQuery.sortBy && (
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded font-medium">
                        Sorted by {parsedQuery.sortBy}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* =========================================================
            FLIGHT RESULTS SECTION
        ========================================================== */}
        <div className="mt-12">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4" />
              <h3 className="text-xl font-bold text-gray-700">
                Searching & Ranking live flight offers...
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Parsing query semantics, contacting flight provider, and calculating match scores
              </p>
            </div>
          ) : hasSearched && flights.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <span className="text-5xl block mb-3">✈️</span>
              <h3 className="text-2xl font-bold text-gray-800">No Flights Found</h3>
              <p className="text-gray-500 mt-2">
                We couldn't find available flights matching your exact criteria. Try adjusting the date, time, or cities.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {flights.length > 0 && (
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xl font-bold text-gray-800">
                    Available Flights ({flights.length})
                  </h3>
                  <span className="text-sm text-gray-500">
                    Prices include all mandatory fees & taxes
                  </span>
                </div>
              )}

              {flights.map((flight) => {
                const depDate = flight.departureTime ? new Date(flight.departureTime) : null;
                const arrDate = flight.arrivalTime ? new Date(flight.arrivalTime) : null;
                const isBooking = bookingLoadingId === (flight.id || flight._id);

                return (
                  <div
                    key={flight.id || flight._id}
                    className={`bg-white rounded-2xl shadow-md hover:shadow-lg border transition p-6 relative overflow-hidden ${
                      flight.isBestMatch ? "border-2 border-blue-500 ring-2 ring-blue-100" : "border-gray-200"
                    }`}
                  >
                    {/* Best Match Ribbon */}
                    {flight.isBestMatch && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-1 rounded-bl-lg shadow-sm">
                        ⭐ Best Match ({flight.matchScore || 95}% Match)
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

                      {/* Airline & Highlights Column */}
                      <div className="lg:col-span-3">
                        <h4 className="text-2xl font-extrabold text-blue-700">
                          {flight.airline}
                        </h4>
                        <p className="text-sm font-semibold text-gray-500 mt-0.5">
                          {flight.flightNumber} • {flight.aircraft || "Airbus A320"}
                        </p>

                        {/* Match Highlights Badges */}
                        {flight.matchHighlights && flight.matchHighlights.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {flight.matchHighlights.map((hl, i) => (
                              <span
                                key={i}
                                className="text-[11px] bg-sky-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium"
                              >
                                {hl}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Flight Timings & Route Column */}
                      <div className="lg:col-span-6">
                        <div className="flex items-center justify-between max-w-md mx-auto">
                          {/* Departure */}
                          <div className="text-left">
                            <span className="text-2xl font-bold text-gray-900 block">
                              {depDate
                                ? depDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                : "--:--"}
                            </span>
                            <span className="text-sm font-bold text-blue-800 block">
                              {flight.source}
                            </span>
                            <span className="text-xs text-gray-500 block">
                              {flight.sourceCity || flight.source}
                            </span>
                          </div>

                          {/* Flight Duration Visual Bar */}
                          <div className="flex-1 px-4 text-center">
                            <span className="text-xs text-gray-500 font-semibold block mb-1">
                              {flight.duration || "2h 30m"}
                            </span>
                            <div className="relative flex items-center justify-center">
                              <div className="w-full h-0.5 bg-gray-300"></div>
                              <span className="absolute text-blue-600 bg-white px-1 text-sm">✈️</span>
                            </div>
                            <span
                              className={`text-[11px] font-semibold block mt-1 ${
                                flight.stops === 0 ? "text-green-600" : "text-amber-600"
                              }`}
                            >
                              {flight.stops === 0 ? "Non-stop" : `${flight.stops} Stop`}
                            </span>
                          </div>

                          {/* Arrival */}
                          <div className="text-right">
                            <span className="text-2xl font-bold text-gray-900 block">
                              {arrDate
                                ? arrDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                : "--:--"}
                            </span>
                            <span className="text-sm font-bold text-blue-800 block">
                              {flight.destination}
                            </span>
                            <span className="text-xs text-gray-500 block">
                              {flight.destinationCity || flight.destination}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-center text-gray-400 mt-2">
                          Departure Date: {depDate ? depDate.toLocaleDateString() : ""}
                        </p>
                      </div>

                      {/* Pricing and Action Column */}
                      <div className="lg:col-span-3 text-right flex flex-col justify-between items-end border-t lg:border-t-0 lg:border-l lg:pl-6 pt-4 lg:pt-0">
                        <div>
                          <span className="text-3xl font-extrabold text-green-600 block">
                            ₹ {flight.price?.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500 block mt-1">
                            {flight.availableSeats ? `${flight.availableSeats} seats remaining` : "Available"}
                          </span>
                        </div>

                        <button
                          onClick={() => handleBookNow(flight)}
                          disabled={isBooking}
                          className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl transition shadow-md hover:shadow-lg disabled:bg-blue-300 flex items-center justify-center gap-2"
                        >
                          {isBooking ? (
                            <>
                              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                              <span>Preparing...</span>
                            </>
                          ) : (
                            <span>Book Now →</span>
                          )}
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

export default SearchForm;