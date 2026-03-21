import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { LoaderProvider } from "./contexts/LoaderContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import Dashboard from "./pages/Dashboard";
import Results from "./pages/Results";

function App() {
  // Safely parse JSON from localStorage
  const safeJSONParse = (key) => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item);
    } catch (err) {
      console.warn(`Failed to parse ${key} from localStorage:`, err);
      localStorage.removeItem(key);
      return null;
    }
  };

  // Load user safely
  const [user, setUser] = useState(() => safeJSONParse("user"));

  // Load JWT token safely
  const [access, setAccess] = useState(() => {
    const token = localStorage.getItem("access");
    return token && token !== "null" ? token : "";
  });

  // Persist OTP email safely
  const [verifyEmail, setVerifyEmail] = useState(() => {
    const email = localStorage.getItem("verifyEmail");
    return email && email !== "null" ? email : "";
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
    setVerifyEmail("");
    localStorage.removeItem("user");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("verifyEmail");
  };

  return (
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