// src/api.js
import axios from "axios";

// ------------------------------
// Base URL from environment
// ------------------------------

// Use REACT_APP_API_URL if defined; fallback to localhost
const BASE_URL =
  (typeof process !== "undefined" && process.env.REACT_APP_API_URL) ||
  "http://127.0.0.1:8000/api/";

// ------------------------------
// Authenticated API (for private endpoints)
// ------------------------------
const API = axios.create({
  baseURL: BASE_URL,
});

// Automatically attach JWT if it exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// ------------------------------
// Public API (no JWT attached)
// ------------------------------
const PublicAPI = axios.create({
  baseURL: BASE_URL,
});

// ------------------------------
// Auth / User API
// ------------------------------

// Public endpoints (no token)
export const registerUser = (data) => PublicAPI.post("register/", data);
export const verifyOTP = (data) => PublicAPI.post("verify-otp/", data);
export const resendOTP = (data) => PublicAPI.post("resend-otp/", data);

// Login: attach JWT after authentication
export const loginUser = async (data) => {
  const res = await PublicAPI.post("login/", data);

  localStorage.setItem("access", res.data.access);
  localStorage.setItem("refresh", res.data.refresh);
  localStorage.setItem("user", JSON.stringify(res.data.user));

  return res.data;
};

// Logout
export const logoutUser = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
};

// Optional: Authenticated GET/POST/PUT/DELETE
export const getData = async (url) => API.get(url);
export const postData = async (url, data) => API.post(url, data);
export const putData = async (url, data) => API.put(url, data);
export const deleteData = async (url) => API.delete(url);

// ------------------------------
// Exports
// ------------------------------
export { API, PublicAPI };
export default API;