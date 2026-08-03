import axios from "axios";

const API = "http://localhost:5000/api/admin";

export const getDashboardStats = async () => {
  const response = await axios.get(
    `${API}/dashboard`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};