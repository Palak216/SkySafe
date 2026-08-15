import axios from "axios";

const API = "https://skysafe-b6bq.onrender.com/api/flights";
const BOOKING_API = "https://skysafe-b6bq.onrender.com/api/bookings";

// ==============================
// Get Flight By ID
// ==============================
export const getFlightById = async (id) => {
  const response = await axios.get(
    `${API}/${id}`
  );

  return response.data;
};

// ==============================
// Search Flights
// ==============================
export const searchFlights = async (params) => {
  const response = await axios.get(
    `${API}/search`,
    {
      params,
    }
  );

  return response.data;
};

// ==============================
// Book Flight
// ==============================
export const bookFlight = async (bookingData) => {
  const response = await axios.post(
    BOOKING_API,
    bookingData,
    {
      withCredentials: true,
    }
  );

  return response.data;
};