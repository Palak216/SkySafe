import axios from "axios";
const API = "https://skysafe-b6bq.onrender.com/api";

export const searchFlights = async (searchData) => {
  const response = await axios.get(`${API}/flights/search`, {
    params: searchData,
  });

  return response.data;
};