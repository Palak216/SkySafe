import api from "./api";

// ==============================
// Register User
// ==============================
export const registerUser = async ({ name, email, password }) => {
  const response = await api.post("/auth/register", {
    name,
    email,
    password,
  });
  return response.data;
};

// ==============================
// Login User
// ==============================
export const loginUser = async ({ email, password }) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });
  return response.data;
};

// ==============================
// Get Logged-in User Profile
// ==============================
export const getProfile = async () => {
  const response = await api.get("/auth/profile");
  return response.data;
};

// ==============================
// Logout User
// ==============================
export const logoutUser = async () => {
  const response = await api.post("/auth/logout", {});
  return response.data;
};