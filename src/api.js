import axios from "axios";
import { useLoader } from "./contexts/LoaderContext"; // ✅ Import the loader hook
import { useRef } from "react";

// ------------------------------
// Base URL
// ------------------------------
const BASE_URL = "https://evoting-system-ozkc.onrender.com/api/";

// ------------------------------
// Authenticated API
// ------------------------------
const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// ------------------------------
// Public API
// ------------------------------
const PublicAPI = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// ------------------------------
// Global loader wrapper
// ------------------------------
export function useApi() {
  const { showLoader, hideLoader } = useLoader();

  // Prevent double-hide if multiple requests finish simultaneously
  const activeCount = useRef(0);

  const call = async (axiosConfig) => {
    activeCount.current += 1;
    showLoader();
    try {
      const res = await axios(axiosConfig);
      return res.data;
    } finally {
      activeCount.current -= 1;
      if (activeCount.current <= 0) {
        hideLoader();
        activeCount.current = 0;
      }
    }
  };

  return { call };
}

// ------------------------------
// Auth / User API
// ------------------------------

// Public endpoints
export const registerUser = (data) => PublicAPI.post("register/", data);
export const verifyOTP = (data) => PublicAPI.post("verify-otp/", data);
export const resendOTP = (data) => PublicAPI.post("resend-otp/", data);

// Login: now you can use useApi() in components to trigger loader
export const loginUser = (data) => PublicAPI.post("login/", data);

// Logout
export const logoutUser = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
};

// Optional: Authenticated GET/POST/PUT/DELETE (use useApi() to trigger loader)
export const getData = (url) => API.get(url);
export const postData = (url, data) => API.post(url, data);
export const putData = (url, data) => API.put(url, data);
export const deleteData = (url) => API.delete(url);

// ------------------------------
// Exports
// ------------------------------
export { API, PublicAPI };
export default API;