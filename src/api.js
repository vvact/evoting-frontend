import axios from "axios";
import { useLoader } from "./contexts/LoaderContext";
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

// Public endpoints (return only data)
export const registerUser = async (data) => (await PublicAPI.post("register/", data)).data;
export const verifyOTP = async (data) => (await PublicAPI.post("verify-otp/", data)).data;
export const resendOTP = async (data) => (await PublicAPI.post("resend-otp/", data)).data;

// Login: return only res.data
export const loginUser = async (data) => {
  const res = await PublicAPI.post("login/", data);
  return res.data; // { access, refresh, user }
};

// Logout
export const logoutUser = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
};

// Optional: Authenticated GET/POST/PUT/DELETE
export const getData = (url) => API.get(url);
export const postData = (url, data) => API.post(url, data);
export const putData = (url, data) => API.put(url, data);
export const deleteData = (url) => API.delete(url);

// ------------------------------
// Exports
// ------------------------------
export { API, PublicAPI };
export default API;