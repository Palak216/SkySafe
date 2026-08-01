import axios from "axios";

const API = "http://localhost:5000/api/auth";

export const registerUser = async (userData) => {
  const response = await axios.post(
    `${API}/register`,
    userData,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

export const loginUser = async (userData) => {
  const response = await axios.post(
    `${API}/login`,
    userData,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

export const getProfile = async () => {
  const response = await axios.get(
    `${API}/profile`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};
