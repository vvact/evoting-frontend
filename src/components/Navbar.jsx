import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const logout = () => {
    // Clear all localStorage items related to auth
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    localStorage.removeItem("verifyEmail");

    if (onLogout) onLogout();

    // Redirect to login page
    navigate("/login");
  };

  return (
    <nav
      style={{
        background: "#111",
        color: "white",
        padding: "12px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: "18px" }}>
        🗳 eVote System
      </div>

      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <Link to="/dashboard" style={{ color: "white", textDecoration: "none" }}>
          Ballot
        </Link>

        <Link to="/results" style={{ color: "white", textDecoration: "none" }}>
          Results
        </Link>

        <span style={{ fontSize: "14px", color: "#ccc" }}>
          {user?.email}
        </span>

        <button
          onClick={logout}
          style={{
            background: "#dc3545",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}