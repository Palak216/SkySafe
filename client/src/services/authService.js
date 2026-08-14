import axios from "axios";

const API = "https://skysafe-b6bq.onrender.com/api/auth";

// ==============================
// Register User
// ==============================
export const registerUser = async (name, email, password) => {
  const response = await axios.post(
    `${API}/register`,
    {
      name,
      email,
      password,
    },
    {
      withCredentials: true,
    }
  );

  return response.data;
};

// ==============================
// Login User
// ==============================
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

// ==============================
// Get Logged-in User Profile
// ==============================
export const getProfile = async () => {
  const response = await axios.get(
    `${API}/profile`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

// ==============================
// Logout User
// ==============================
export const logoutUser = async () => {
  const response = await axios.post(
    `${API}/logout`,
    {},
    {
      withCredentials: true,
    }
  );

  return response.data;
};