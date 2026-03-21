import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { LoaderProvider } from "./contexts/LoaderContext"; // ✅ Import loader provider

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import Dashboard from "./pages/Dashboard";
import Results from "./pages/Results";

function App() {
  // Load user from localStorage if exists
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // JWT access token
  const [access, setAccess] = useState(() => localStorage.getItem("access") || "");

  // Persist OTP email across refreshes
  const [verifyEmail, setVerifyEmail] = useState(() => {
    return localStorage.getItem("verifyEmail") || "";
  });

  // Sync verifyEmail to localStorage
  useEffect(() => {
    if (verifyEmail) localStorage.setItem("verifyEmail", verifyEmail);
    else localStorage.removeItem("verifyEmail");
  }, [verifyEmail]);

  // Handle login
  const handleLogin = (userData, tokens) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    if (tokens) {
      setAccess(tokens.access);
      localStorage.setItem("access", tokens.access);
      localStorage.setItem("refresh", tokens.refresh);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    setAccess("");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    localStorage.removeItem("verifyEmail");
    setVerifyEmail("");
  };

  return (
    // ✅ Wrap entire app with LoaderProvider
    <LoaderProvider>
      <Router>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<Landing />} />

          {/* Login */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />

          {/* Register */}
          <Route path="/register" element={<Register setVerifyEmail={setVerifyEmail} />} />

          {/* OTP Verify */}
          <Route
            path="/verify"
            element={
              verifyEmail ? (
                <Verify email={verifyEmail} setVerifyEmail={setVerifyEmail} />
              ) : (
                <Navigate to="/register" />
              )
            }
          />

          {/* Dashboard (requires JWT access) */}
          <Route
            path="/dashboard"
            element={
              access ? (
                <Dashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Results Page (requires JWT access) */}
          <Route
            path="/results"
            element={
              access ? (
                <Results user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </LoaderProvider>
  );
}

export default App;