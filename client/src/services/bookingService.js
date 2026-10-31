import api, { API_BASE_URL } from "./api";

/**
 * Reserve Seats & Create PENDING_PAYMENT Booking
 */
export const bookFlight = async ({ flightId, passengers }) => {
  const response = await api.post("/bookings", {
    flightId,
    passengers,
  });
  return response.data;
};

/**
 * Get My Bookings (Paginated)
 */
export const getMyBookings = async (params = {}) => {
  const response = await api.get("/bookings", { params });
  return response.data;
};

/**
 * Get Single Booking By ID
 */
export const getBookingById = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}`);
  return response.data;
};

/**
 * Cancel Booking (idempotent, refund policy aware)
 */
export const cancelBooking = async (bookingId, reason = "User requested cancellation") => {
  const response = await api.post(`/bookings/${bookingId}/cancel`, { reason });
  return response.data;
};

/**
 * Download PDF E-Ticket URL or Blob
 */
export const getTicketDownloadUrl = (bookingId) => {
  return `${API_BASE_URL}/bookings/${bookingId}/ticket`;
};

export const downloadETicketBlob = async (bookingId, pnr = "ticket") => {
  const response = await api.get(`/bookings/${bookingId}/ticket`, {
    responseType: "blob",
  });
  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SkySafe-Ticket-${pnr}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
