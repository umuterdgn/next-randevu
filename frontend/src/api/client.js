import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor for 401 and 403 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Show toast notification
      toast.error("Oturum süreniz doldu, lütfen tekrar giriş yapın", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Redirect to login page
      window.location.href = "/login";
    }

    // Handle require_apply flag (user needs to create business)
    if (error.response?.data?.require_apply || (error.response?.status === 403 && error.response?.data?.require_apply)) {
      // Redirect to apply page without showing error
      window.location.href = "/apply";
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
