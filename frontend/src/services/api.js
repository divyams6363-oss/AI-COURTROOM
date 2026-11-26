import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.3.96:8000",
  timeout: 20000,
  headers: {
    Accept: "application/json"
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "API Error:",
      error.config?.url,
      error.response?.status || error.message
    );
    return Promise.reject(error);
  }
);

export default api;