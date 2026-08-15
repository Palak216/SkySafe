import { useEffect, useState } from "react";
import { getMyBookings, cancelBooking } from "../services/bookingService";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await getMyBookings();

      console.log("MY BOOKINGS:", data);

      setBookings(data.bookings || []);
    } catch (error) {
      console.error(
        "MY BOOKINGS ERROR:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmCancel) return;

    try {
      const data = await cancelBooking(bookingId);

      alert(data.message);

      await fetchBookings();
    } catch (error) {
      console.error(
        "CANCEL ERROR:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Unable to cancel booking"
      );
    }
  };

  if (loading) {
    return (
      <h1 className="text-center mt-20 text-3xl">
        Loading...
      </h1>
    );
  }

  return (
    <section className="max-w-6xl mx-auto py-16 px-5">

      <h1 className="text-4xl font-bold text-blue-700 mb-10">
        My Bookings
      </h1>

      {bookings.length === 0 ? (
        <h2 className="text-gray-500 text-xl">
          No Bookings Yet
        </h2>
      ) : (
        bookings.map((booking) => (
          <div
            key={booking._id}
            className="bg-white shadow-lg rounded-xl p-6 mb-6"
          >
            <h2 className="text-2xl font-bold text-blue-700">
              {booking.flight?.airline}
            </h2>

            <p>
              <strong>Flight:</strong>{" "}
              {booking.flight?.flightNumber}
            </p>

            <p>
              <strong>Route:</strong>{" "}
              {booking.flight?.source} →{" "}
              {booking.flight?.destination}
            </p>

            <p>
              <strong>Booking Ref:</strong>{" "}
              {booking.bookingRef}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {booking.status}
            </p>

            <p>
              <strong>Seats:</strong>{" "}
              {booking.seatsBooked}
            </p>

            <h2 className="text-green-600 text-2xl font-bold mt-4">
              ₹ {booking.totalPrice}
            </h2>

            {booking.status === "Confirmed" && (
              <button
                onClick={() =>
                  handleCancelBooking(booking._id)
                }
                className="mt-5 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
              >
                Cancel Booking
              </button>
            )}
          </div>
        ))
      )}

    </section>
  );
}

export default MyBookings;