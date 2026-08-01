import axios from "axios";

const API = "http://localhost:5000/api";

export const searchFlights = async (searchData) => {
  const response = await axios.get(`${API}/flights/search`, {
    params: searchData,
  });

  return response.data;
};