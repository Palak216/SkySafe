import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getBookingById, downloadETicketBlob } from "../services/bookingService";

function BookingConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await getBookingById(id);
      setBooking(res.booking || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (!booking) return;
    try {
      setDownloading(true);
      await downloadETicketBlob(booking._id, booking.pnr);
    } catch (e) {
      alert("Failed to download PDF ticket. Please try from 'My Bookings'.");
    } finally {
      setDownloading(false);
    }
  };

  const copyPNR = () => {
    if (booking?.pnr) {
      navigator.clipboard.writeText(booking.pnr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto py-24 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Fetching booking confirmation...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto py-20 px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">Booking Record Not Found</h2>
          <button
            onClick={() => navigate("/my-bookings")}
            className="mt-6 bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-800"
          >
            Go to My Bookings
          </button>
        </div>
      </div>
    );
  }

  const flight = booking.flight || {};

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-12 flex-1 w-full">
        {/* Celebration Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm animate-bounce">
            ✓
          </div>
          <h1 className="text-3xl font-black text-gray-900">Booking Confirmed!</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Your flight ticket is verified and ready. A confirmation email has been dispatched.
          </p>
        </div>

        {/* PNR Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-blue-700 p-6 text-white text-center">
            <span className="text-xs uppercase tracking-widest text-blue-200 font-bold">
              Passenger Name Record (PNR)
            </span>
            <div className="flex items-center justify-center gap-3 mt-1">
              <span className="text-4xl font-black font-mono tracking-widest">{booking.pnr}</span>
              <button
                onClick={copyPNR}
                className="bg-blue-800 hover:bg-blue-900 text-xs px-2.5 py-1 rounded text-blue-200 transition"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <span className="inline-block mt-3 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
              STATUS: CONFIRMED
            </span>
          </div>

          {/* Flight Summary */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Airline & Flight</p>
                <p className="font-extrabold text-gray-900 text-lg">
                  {flight.airline} ({flight.flightNumber})
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-semibold">Route</p>
                <p className="font-extrabold text-blue-700 text-lg">
                  {flight.origin} &rarr; {flight.destination}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 font-medium">Departure</p>
                <p className="font-bold text-gray-800 mt-0.5">
                  {flight.departureTime &&
                    new Date(flight.departureTime).toLocaleString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Arrival</p>
                <p className="font-bold text-gray-800 mt-0.5">
                  {flight.arrivalTime &&
                    new Date(flight.arrivalTime).toLocaleString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </p>
              </div>
            </div>

            {/* Passenger Manifest */}
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Confirmed Passengers</p>
              <div className="bg-gray-50 rounded-xl p-4 divide-y divide-gray-200">
                {booking.passengers?.map((p, i) => (
                  <div key={i} className="py-2 first:pt-0 last:pb-0 flex justify-between text-sm">
                    <span className="font-medium text-gray-900">{p.name}</span>
                    <span className="text-gray-500 text-xs">
                      {p.gender === "M" ? "Male" : p.gender === "F" ? "Female" : "Other"}, {p.age} yrs
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Record */}
            <div className="flex justify-between items-center pt-4 border-t text-sm">
              <span className="text-gray-500">Payment ID: {booking.payment?.razorpayPaymentId || "Completed"}</span>
              <span className="font-extrabold text-xl text-green-600">₹{booking.totalAmount}</span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                disabled={downloading}
                onClick={handleDownloadTicket}
                className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <span>Generating PDF Ticket...</span>
                ) : (
                  <>
                    <span>📄</span>
                    <span>Download PDF E-Ticket</span>
                  </>
                )}
              </button>

              <Link
                to="/my-bookings"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 px-6 rounded-xl text-center transition"
              >
                View My Bookings
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BookingConfirmation;
