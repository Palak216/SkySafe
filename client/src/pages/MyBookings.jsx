import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";

import {
  getMyBookings,
  cancelBooking,
} from "../services/bookingService";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ==============================
  // Fetch My Bookings
  // ==============================

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await getMyBookings();

      console.log("My Bookings:", data.bookings);

      setBookings(data.bookings || []);
    } catch (error) {
      console.log("Fetch bookings error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to fetch bookings"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Cancel Booking
  // ==============================

  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmCancel) {
      return;
    }

    try {
      const data = await cancelBooking(bookingId);

      alert(data.message);

      // Refresh bookings after cancellation
      await fetchBookings();

    } catch (error) {
      console.log("Cancel booking error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to cancel booking"
      );
    }
  };

  // ==============================
  // Loading
  // ==============================

  if (loading) {
    return (
      <>
        <Navbar />

        <h1 className="text-center mt-20 text-3xl">
          Loading...
        </h1>
      </>
    );
  }

  // ==============================
  // UI
  // ==============================

  return (
    <>
      {/* Navbar */}
      <Navbar />

      <section className="max-w-6xl mx-auto py-16 px-5">

        {/* Page Heading */}
        <h1 className="text-4xl font-bold text-blue-700 mb-10">
          My Bookings
        </h1>

        {/* No Bookings */}
        {bookings.length === 0 ? (
          <div className="text-center mt-20">

            <h2 className="text-gray-500 text-xl mb-6">
              No Bookings Yet
            </h2>

            <button
              onClick={() => navigate("/home")}
              className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg"
            >
              Search Flights
            </button>

          </div>
        ) : (

          /* Bookings List */
          bookings.map((booking) => (

            <div
              key={booking._id}
              className="bg-white shadow-lg rounded-xl p-6 mb-6"
            >

              {/* Airline */}
              <h2 className="text-2xl font-bold text-blue-700">
                {booking.flight?.airline}
              </h2>

              {/* Flight Number */}
              <p>
                <strong>Flight:</strong>{" "}
                {booking.flight?.flightNumber}
              </p>

              {/* Route */}
              <p>
                <strong>Route:</strong>{" "}
                {booking.flight?.source} →{" "}
                {booking.flight?.destination}
              </p>

              {/* Booking Reference */}
              <p>
                <strong>Booking Ref:</strong>{" "}
                {booking.bookingRef}
              </p>

              {/* Status */}
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    booking.status === "Confirmed"
                      ? "text-green-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
                  {booking.status}
                </span>
              </p>

              {/* Seats */}
              <p>
                <strong>Seats:</strong>{" "}
                {booking.seatsBooked}
              </p>

              {/* Total Price */}
              <h2 className="text-green-600 text-2xl font-bold mt-4">
                ₹ {booking.totalPrice}
              </h2>

              {/* Cancel Button */}
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
    </>
  );
}

export default MyBookings;