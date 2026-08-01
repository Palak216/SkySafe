import axios from "axios";

const API = "http://localhost:5000/api";

export const createBooking = async (bookingData, token) => {
  const response = await axios.post(
    `${API}/bookings`,
    bookingData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};