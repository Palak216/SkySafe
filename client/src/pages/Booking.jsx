import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getFlightById } from "../services/flightService";
import { bookFlight } from "../services/bookingService";

function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [passengers, setPassengers] = useState([
    { name: "", age: "", gender: "M" },
  ]);

  useEffect(() => {
    fetchFlightDetails();
  }, [id]);

  const fetchFlightDetails = async () => {
    try {
      setLoading(true);
      const data = await getFlightById(id);
      setFlight(data.flight || data.data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to load flight details");
    } finally {
      setLoading(false);
    }
  };

  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  const addPassenger = () => {
    if (passengers.length >= 9) {
      alert("Maximum 9 passengers permitted per reservation.");
      return;
    }
    setPassengers([...passengers, { name: "", age: "", gender: "M" }]);
  };

  const removePassenger = (index) => {
    if (passengers.length <= 1) return;
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Validation
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name || p.name.trim().length < 2) {
        setErrorMessage(`Please enter a valid full name for Passenger ${i + 1}`);
        return;
      }
      const ageNum = parseInt(p.age, 10);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        setErrorMessage(`Please enter a valid age (1-120) for Passenger ${i + 1}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        flightId: id,
        passengers: passengers.map((p) => ({
          name: p.name.trim(),
          age: parseInt(p.age, 10),
          gender: p.gender,
        })),
      };

      const res = await bookFlight(payload);
      const createdBooking = res.data || res.booking;

      // Redirect to Checkout page with 10-minute payment countdown
      navigate(`/checkout/${createdBooking._id}`);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        "Booking failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading flight information...</p>
        </div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto py-20 px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">Flight Not Found</h2>
          <p className="text-gray-500 mt-2">The requested flight schedule could not be located.</p>
          <button
            onClick={() => navigate("/home")}
            className="mt-6 bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-800"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const depDate = new Date(flight.departureTime);
  const arrDate = new Date(flight.arrivalTime);
  const totalAmount = flight.price * passengers.length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full">
        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-4 text-sm font-semibold">
          <span className="flex items-center gap-2 text-blue-700">
            <span className="w-7 h-7 bg-blue-700 text-white rounded-full flex items-center justify-center text-xs">1</span>
            Passenger Info
          </span>
          <span className="w-12 h-0.5 bg-gray-300"></span>
          <span className="flex items-center gap-2 text-gray-400">
            <span className="w-7 h-7 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-xs">2</span>
            Payment & Confirmation
          </span>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between">
            <p className="text-sm font-medium">{errorMessage}</p>
            <button onClick={() => setErrorMessage("")} className="text-sm font-bold text-red-500">&times;</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Passenger Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleBookingSubmit} className="space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Passenger Details</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Please ensure names match your government photo IDs.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addPassenger}
                    className="text-sm text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    + Add Passenger
                  </button>
                </div>

                <div className="space-y-6">
                  {passengers.map((passenger, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                          Passenger {index + 1}
                        </span>
                        {passengers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePassenger(index)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                        <div className="sm:col-span-3">
                          <label className="block text-xs text-gray-500 font-medium mb-1">Full Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. John Doe"
                            value={passenger.name}
                            onChange={(e) => handlePassengerChange(index, "name", e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <label className="block text-xs text-gray-500 font-medium mb-1">Age</label>
                          <input
                            type="number"
                            required
                            min="1"
                            max="120"
                            placeholder="28"
                            value={passenger.age}
                            onChange={(e) => handlePassengerChange(index, "age", e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-500 font-medium mb-1">Gender</label>
                          <select
                            value={passenger.gender}
                            onChange={(e) => handlePassengerChange(index, "gender", e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="O">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Reserving Seats...</span>
                  </>
                ) : (
                  <span>Proceed to Payment (₹{totalAmount.toLocaleString("en-IN")}) &rarr;</span>
                )}
              </button>
            </form>
          </div>

          {/* Flight Summary Card */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 text-base mb-4 pb-2 border-b">Flight Summary</h3>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-700 font-bold rounded-lg flex items-center justify-center text-sm">
                  {flight.airline?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{flight.airline}</h4>
                  <p className="text-xs text-gray-500 font-mono">{flight.flightNumber}</p>
                </div>
              </div>

              <div className="space-y-3 py-3 border-y border-gray-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Route:</span>
                  <span className="font-bold text-gray-800">{flight.origin} &rarr; {flight.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Departure:</span>
                  <span className="font-medium text-gray-800">
                    {depDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })},{" "}
                    {depDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-medium text-gray-800">{flight.duration}</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="mt-4 pt-2 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Fare ({passengers.length} × ₹{flight.price}):</span>
                  <span>₹{(flight.price * passengers.length).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes & Airport Fees:</span>
                  <span className="text-green-600 font-medium">Included</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t">
                  <span>Total Payable:</span>
                  <span className="text-blue-700">₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Policy badge */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
              <p className="font-bold">🛡️ SkySafe Cancellation Guarantee:</p>
              <p>• 100% refund if cancelled &gt; 24h before departure.</p>
              <p>• 50% refund within 24h of departure.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default Booking;
