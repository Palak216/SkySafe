import axios from "axios";

const API = "https://skysafe-b6bq.onrender.com";

export const getDashboardStats = async () => {
  const response = await axios.get(
    `${API}/dashboard`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};