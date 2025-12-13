import axios from "axios";

const API_URL = "http://127.0.0.1:5000";

export const getStats = async () => {
  const res = await axios.get(`${API_URL}/stats`);
  return res.data;
};

export const sendImageForPrediction = async (formData) => {
  const res = await axios.post(`${API_URL}/predict`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};
