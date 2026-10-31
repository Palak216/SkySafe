import api from "./api";

/**
 * Traditional Flight Search with query params & pagination
 */
export const searchFlights = async (params = {}) => {
  const response = await api.get("/flights", { params });
  return response.data;
};

/**
 * Natural Language Flight Search (Phase 7)
 */
export const searchFlightsNL = async (textQuery) => {
  const response = await api.post("/flights/nl-search", {
    query: textQuery,
  });
  return response.data;
};

/**
 * Get Flight By ID
 */
export const getFlightById = async (id) => {
  const response = await api.get(`/flights/${id}`);
  return response.data;
};

/**
 * Get All Flights
 */
export const getAllFlights = async (params = {}) => {
  const response = await api.get("/flights", { params });
  return response.data;
};
