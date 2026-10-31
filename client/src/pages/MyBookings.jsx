import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getMyBookings, cancelBooking, downloadETicketBlob } from "../services/bookingService";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings(1);
  }, []);

  const fetchBookings = async (page = 1) => {
    try {
      setLoading(true);
      const data = await getMyBookings({ page, limit: 10 });
      setBookings(data.bookings || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: data.bookings?.length || 0 });
    } catch (error) {
      console.error("Fetch bookings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    const isPaid = booking.status === "CONFIRMED";
    const confirmMsg = isPaid
      ? "Are you sure you want to cancel this booking? A refund will be automatically calculated according to cancellation policy (>24h: 100%, <24h: 50%)."
      : "Are you sure you want to cancel this pending reservation?";

    if (!window.confirm(confirmMsg)) return;

    try {
      setCancellingId(booking._id);
      const res = await cancelBooking(booking._id);
      alert(res.message || "Booking cancelled successfully.");
      await fetchBookings(pagination.page);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleDownload = async (booking) => {
    try {
      setDownloadingId(booking._id);
      await downloadETicketBlob(booking._id, booking.pnr);
    } catch (e) {
      alert("Failed to download PDF ticket.");
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">CONFIRMED</span>;
      case "PENDING_PAYMENT":
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">PENDING PAYMENT</span>;
      case "CANCELLED":
        return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">CANCELLED</span>;
      case "EXPIRED":
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">EXPIRED</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-gray-200 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900">My Bookings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your flight reservations, download tickets, and track refund status.
            </p>
          </div>
          <button
            onClick={() => navigate("/home")}
            className="self-start sm:self-auto bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition"
          >
            + Book Another Flight
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-200">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-200">
            <span className="text-6xl">🛫</span>
            <h3 className="text-xl font-bold text-gray-800 mt-4">No Bookings Found</h3>
            <p className="text-gray-500 mt-1 max-w-sm mx-auto text-sm">
              You haven't made any flight bookings yet. Search scheduled flights across popular destinations.
            </p>
            <button
              onClick={() => navigate("/home")}
              className="mt-6 bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition"
            >
              Explore Flights
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((b) => {
              const flight = b.flight || {};
              const depDate = flight.departureTime ? new Date(flight.departureTime) : null;
              const isConfirmed = b.status === "CONFIRMED";
              const isPending = b.status === "PENDING_PAYMENT";
              const isCancellable = isConfirmed || isPending;

              return (
                <div
                  key={b._id}
                  className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-200 hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  {/* Left Column: Airline, Route & PNR */}
                  <div className="space-y-3 min-w-[280px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-700 font-bold rounded-lg flex items-center justify-center text-sm">
                        {flight.airline?.slice(0, 2).toUpperCase() || "SK"}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-base">{flight.airline || "Airline"}</h3>
                        <p className="text-xs text-gray-500 font-mono">
                          {flight.flightNumber} • {flight.aircraft}
                        </p>
                      </div>
                      <div className="ml-auto md:hidden">{getStatusBadge(b.status)}</div>
                    </div>

                    <div className="flex items-center gap-3 text-lg font-bold text-blue-700">
                      <span>{flight.origin || "ORIGIN"}</span>
                      <span className="text-gray-400 font-light text-base">✈️</span>
                      <span>{flight.destination || "DEST"}</span>
                    </div>

                    <div className="text-xs text-gray-500 space-y-0.5">
                      <p>
                        <strong>Departure:</strong>{" "}
                        {depDate
                          ? depDate.toLocaleString("en-IN", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Scheduled"}
                      </p>
                      <p>
                        <strong>PNR:</strong> <span className="font-mono font-bold text-gray-900">{b.pnr}</span>
                      </p>
                      <p>
                        <strong>Passengers:</strong> {b.passengers?.map((p) => p.name).join(", ")}
                      </p>
                    </div>
                  </div>

                  {/* Middle Column: Status Badge & Refund details */}
                  <div className="hidden md:flex flex-col items-center">
                    {getStatusBadge(b.status)}
                    {b.cancellation?.refundAmount ? (
                      <span className="text-[11px] text-green-600 font-medium mt-2">
                        Refunded: ₹{b.cancellation.refundAmount}
                      </span>
                    ) : null}
                  </div>

                  {/* Right Column: Price & Actions */}
                  <div className="text-right flex md:flex-col justify-between items-center md:items-end gap-3 pt-4 md:pt-0 border-t md:border-t-0">
                    <div>
                      <span className="text-xs text-gray-400 block">Total Fare</span>
                      <span className="text-2xl font-black text-gray-900">₹{b.totalAmount}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      {isPending && (
                        <Link
                          to={`/checkout/${b._id}`}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                        >
                          Complete Payment
                        </Link>
                      )}

                      {isConfirmed && (
                        <button
                          disabled={downloadingId === b._id}
                          onClick={() => handleDownload(b)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3.5 py-2 rounded-lg transition flex items-center gap-1"
                        >
                          <span>📄</span>
                          <span>{downloadingId === b._id ? "Downloading..." : "E-Ticket"}</span>
                        </button>
                      )}

                      {isCancellable && (
                        <button
                          disabled={cancellingId === b._id}
                          onClick={() => handleCancelBooking(b)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-2 rounded-lg transition"
                        >
                          {cancellingId === b._id ? "Cancelling..." : "Cancel Booking"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-200 mt-6 shadow-sm">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchBookings(pagination.page - 1)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  &larr; Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page <strong className="text-gray-900">{pagination.page}</strong> of{" "}
                  <strong className="text-gray-900">{pagination.totalPages}</strong>
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchBookings(pagination.page + 1)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyBookings;
