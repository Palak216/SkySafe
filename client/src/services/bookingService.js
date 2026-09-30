import api from "./api";

// Book Flight
export const bookFlight = async (bookingData) => {
  const response = await api.post("/bookings", bookingData);
  return response.data;
};

// Get My Bookings
export const getMyBookings = async () => {
  const response = await api.get("/bookings/my");
  return response.data;
};

// Cancel Booking
export const cancelBooking = async (bookingId) => {
  const response = await api.delete(`/bookings/${bookingId}`);
  return response.data;
};