import api from "./api";

// Search Flights (Traditional)
export const searchFlights = async (searchData) => {
  const response = await api.get("/flights/search", {
    params: searchData,
  });
  return response.data;
};

// Get Flight By ID
export const getFlightById = async (id) => {
  const response = await api.get(`/flights/${id}`);
  return response.data;
};

// Get All Flights
export const getAllFlights = async () => {
  const response = await api.get("/flights");
  return response.data;
};