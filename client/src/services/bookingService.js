import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/bookings`;

export const bookFlight = async (bookingData) => {
  const response = await axios.post(
    API,
    bookingData,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

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