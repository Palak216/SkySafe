import api from "./api";

// ==============================
// Get Admin Dashboard Statistics
// ==============================
export const getDashboardStats = async () => {
  const response = await api.get("/admin/dashboard");
  return response.data;
};

// ==============================
// Admin Flight Management Operations
// ==============================
export const getAllFlights = async () => {
  const response = await api.get("/flights");
  return response.data;
};

export const addFlight = async (flightData) => {
  const response = await api.post("/flights", flightData);
  return response.data;
};

export const updateFlight = async (id, flightData) => {
  const response = await api.put(`/flights/${id}`, flightData);
  return response.data;
};

export const deleteFlight = async (id) => {
  const response = await api.delete(`/flights/${id}`);
  return response.data;
};