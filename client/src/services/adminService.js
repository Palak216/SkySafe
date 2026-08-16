import axios from "axios";

const API = "https://skysafe-b6bq.onrender.com/api/admin";

// ==============================
// Get Admin Dashboard Statistics
// ==============================
export const getDashboardStats = async () => {
  const response = await axios.get(
    `${API}/dashboard`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};