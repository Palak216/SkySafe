import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/auth`;

export const loginUser = async (email, password) => {
  const response = await axios.post(
    `${API}/login`,
    {
      email,
      password,
    },
    {
      withCredentials: true,
    }
  );

  return response.data;
};