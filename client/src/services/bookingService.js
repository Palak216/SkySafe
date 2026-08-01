import axios from "axios";

const API = "http://localhost:5000/api/bookings";

export const getMyBookings = async () => {
  const response = await axios.get(
    `${API}/my`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

export const cancelBooking = async (id) => {
  const response = await axios.delete(
    `${API}/${id}`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};