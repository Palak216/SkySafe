import axios from "axios";

/**
 * Centralized Axios API Client
 * - Configures baseURL based on VITE_API_URL or environment (localhost in dev, Render in prod)
 * - Automatically attaches credentials (HTTP-only cookies)
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://skysafe-b6bq.onrender.com/api");

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
export { API_BASE_URL };
