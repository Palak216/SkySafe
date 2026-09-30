import api from "./api";

/**
 * AI Flight Service
 * Communicates with backend natural language parsing and flight booking bridge.
 */

// Search flights via Natural Language Query
export const searchFlightsAI = async (message) => {
  const response = await api.post("/ai/flights/search", { message });
  return response.data;
};

// Bridge external/mock flight result into SkySafe's MongoDB booking system
export const prepareFlightForBooking = async (flight) => {
  const response = await api.post("/flights/bridge-or-prepare", { flight });
  return response.data;
};
