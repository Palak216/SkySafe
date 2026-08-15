import axios from "axios";

const API = "https://skysafe-b6bq.onrender.com/api/flights";

// Search Flights
export const searchFlights = async (searchData) => {
  const response = await axios.get(`${API}/search`, {
    params: searchData,
    withCredentials: true,
  });

  return response.data;
};

// Get Flight By ID
export const getFlightById = async (id) => {
  const response = await axios.get(`${API}/${id}`, {
    withCredentials: true,
  });

  return response.data;
};