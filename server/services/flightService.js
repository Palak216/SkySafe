import axios from "axios";

const API = "https://skysafe-b6bq.onrender.com/api/flights";

// ==============================
// Get All Flights
// ==============================
export const getAllFlights = async () => {
  const response = await axios.get(API);

  return response.data;
};

// ==============================
// Search Flights
// ==============================
export const searchFlights = async (
  source,
  destination,
  status
) => {
  const response = await axios.get(`${API}/search`, {
    params: {
      source,
      destination,
      status,
    },
  });

  return response.data;
};

// ==============================
// Get Flight By ID
// ==============================
export const getFlightById = async (id) => {
  const response = await axios.get(`${API}/${id}`);

  return response.data;
};

// ==============================
// Book Flight
// ==============================
export const bookFlight = async (bookingData) => {
  const response = await axios.post(
    `${API}/book`,
    bookingData,
    {
      withCredentials: true,
    }
  );

  return response.data;
};