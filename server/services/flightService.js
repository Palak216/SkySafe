import axios from "axios";

const API = "http://localhost:5000/api";

export const searchFlights = async (searchData) => {
  const url = `${API}/flights/search`;

  console.log("Calling:", url);
  console.log("Params:", searchData);

  const response = await axios.get(url, {
    params: searchData,
  });

  console.log("Response:", response);

  return response.data;
};