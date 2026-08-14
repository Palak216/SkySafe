import axios from "axios";

const API = "http://localhost:5000/api/flights";

export const bookFlight = async (bookingData) => {
  const response = await axios.post(
    `${API}/book`,
    bookingData,
    {
      withCredentials: true,
    }
  );

  return response.data;
};