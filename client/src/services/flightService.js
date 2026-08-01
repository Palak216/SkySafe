import axios from "axios";

const API = "http://localhost:5000/api";

// ==========================
// Search Flights
// ==========================
export const searchFlights = async (searchData) => {
  const response = await axios.get(`${API}/flights/search`, {
    params: searchData,
  });

  return response.data;
};

// ==========================
// Get Flight By ID
// ==========================
export const getFlightById = async (id) => {
  const response = await axios.get(`${API}/flights/${id}`);

  return response.data;
};

// ==========================
// Book Flight
// ==========================
export const bookFlight = async (bookingData) => {
  const response = await axios.post(
    `${API}/bookings`,
    bookingData,
    {
      withCredentials: true,
    }
  );

  return response.data;
};