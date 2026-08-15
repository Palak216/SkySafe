import axios from "axios";

const API = "https://skysafe-b6bq.onrender.com/api/bookings";

// Book Flight
export const bookFlight = async (bookingData) => {
  const response = await axios.post(
    API,
    bookingData,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

// Get My Bookings
export const getMyBookings = async () => {
  const response = await axios.get(
    `${API}/my`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

// Cancel Booking
export const cancelBooking = async (bookingId) => {
  const response = await axios.delete(
    `${API}/${bookingId}`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};