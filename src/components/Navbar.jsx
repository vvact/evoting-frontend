import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  // Shrink navbar on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    localStorage.removeItem("verifyEmail");
    if (onLogout) onLogout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || user.email?.[0]?.toUpperCase()
    : "?";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=DM+Sans:wght@400;500&display=swap');

        .navbar {
          position: sticky;
          top: 0;
          z-index: 40;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.3s, border-color 0.3s, padding 0.3s, box-shadow 0.3s;
        }
        
        /* Light mode navbar */
        .navbar.light-mode {
          background: rgba(255,255,255,0.95);
          border-bottom: 1px solid rgba(0,0,0,0.08);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .navbar.light-mode.scrolled {
          background: rgba(255,255,255,0.98);
          border-bottom: 1px solid rgba(0,0,0,0.1);
          box-shadow: 0 4px 32px rgba(0,0,0,0.08);
        }
        
        /* Dark mode navbar */
        .navbar.dark-mode {
          background: rgba(10,10,10,0.85);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .navbar.dark-mode.scrolled {
          background: rgba(8,8,8,0.97);
          border-bottom: 1px solid rgba(255,255,255,0.09);
          box-shadow: 0 4px 32px rgba(0,0,0,0.4);
        }

        .navbar-stripe {
          height: 3px;
          background: linear-gradient(90deg, #000 0%, #d21034 50%, #007a33 100%);
        }

        .navbar-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 58px;
          transition: height 0.3s;
        }
        .navbar.scrolled .navbar-inner { height: 52px; }

        /* ── Brand ── */
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .brand-flag { font-size: 20px; line-height: 1; }
        .brand-text {
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          font-weight: 700;
          transition: color 0.3s;
        }
        .light-mode .brand-text { color: #1a1a2e; }
        .dark-mode .brand-text { color: #fff; }
        .brand-text span { color: #d21034; }
        .brand-divider {
          width: 1px; height: 18px;
          transition: background 0.3s;
        }
        .light-mode .brand-divider { background: rgba(0,0,0,0.12); }
        .dark-mode .brand-divider { background: rgba(255,255,255,0.12); }
        .brand-sub {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: color 0.3s;
        }
        .light-mode .brand-sub { color: rgba(0,0,0,0.4); }
        .dark-mode .brand-sub { color: rgba(255,255,255,0.3); }

        /* ── Desktop nav links ── */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        @media (max-width: 640px) { .nav-links { display: none; } }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
          position: relative;
        }
        .light-mode .nav-link { color: rgba(0,0,0,0.5); }
        .dark-mode .nav-link { color: rgba(255,255,255,0.45); }
        
        .light-mode .nav-link:hover { color: #1a1a2e; background: rgba(0,0,0,0.05); }
        .dark-mode .nav-link:hover { color: #fff; background: rgba(255,255,255,0.06); }
        
        .light-mode .nav-link.active { color: #1a1a2e; background: rgba(0,0,0,0.08); }
        .dark-mode .nav-link.active { color: #fff; background: rgba(255,255,255,0.08); }
        
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 14px; right: 14px;
          height: 2px; border-radius: 99px;
          background: #d21034;
        }
        .nav-link-icon { font-size: 14px; }

        /* ── Right side ── */
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* ── User avatar + dropdown ── */
        .user-menu { position: relative; }
        .user-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 99px;
          padding: 4px 12px 4px 4px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .light-mode .user-btn {
          background: rgba(0,0,0,0.04);
          border: 1px solid rgba(0,0,0,0.1);
          color: #1a1a2e;
        }
        .dark-mode .user-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
        }
        .light-mode .user-btn:hover {
          background: rgba(0,0,0,0.08);
          border-color: rgba(0,0,0,0.18);
        }
        .dark-mode .user-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.18);
        }
        .user-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, #d21034, #007a33);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Sora', sans-serif;
          font-size: 12px; font-weight: 700; color: #fff;
          flex-shrink: 0;
        }
        .user-name {
          font-size: 13px; font-weight: 500;
          max-width: 100px; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap;
        }
        .user-chevron {
          font-size: 10px;
          transition: transform 0.25s, color 0.3s;
          margin-left: 2px;
        }
        .light-mode .user-chevron { color: rgba(0,0,0,0.35); }
        .dark-mode .user-chevron { color: rgba(255,255,255,0.35); }
        .user-chevron.open { transform: rotate(180deg); }

        /* ── Dropdown ── */
        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 220px;
          border-radius: 14px;
          overflow: hidden;
          animation: dropIn 0.2s cubic-bezier(0.175,0.885,0.32,1.275);
          z-index: 100;
        }
        .light-mode .user-dropdown {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.1);
          box-shadow: 0 16px 48px rgba(0,0,0,0.15);
        }
        .dark-mode .user-dropdown {
          background: #16213e;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 16px 48px rgba(0,0,0,0.5);
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to   { opacity: 1; transform: none; }
        }

        .dropdown-header {
          padding: 14px 16px 10px;
          transition: border-color 0.3s;
        }
        .light-mode .dropdown-header { border-bottom: 1px solid rgba(0,0,0,0.07); }
        .dark-mode .dropdown-header { border-bottom: 1px solid rgba(255,255,255,0.07); }
        
        .dropdown-name {
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 700;
          transition: color 0.3s;
        }
        .light-mode .dropdown-name { color: #1a1a2e; }
        .dark-mode .dropdown-name { color: #fff; }
        
        .dropdown-email {
          font-size: 11px;
          margin-top: 2px; word-break: break-all;
          transition: color 0.3s;
        }
        .light-mode .dropdown-email { color: rgba(0,0,0,0.35); }
        .dark-mode .dropdown-email { color: rgba(255,255,255,0.35); }
        
        .dropdown-id {
          display: inline-flex; align-items: center; gap: 4px;
          margin-top: 6px; padding: 2px 8px;
          border-radius: 99px;
          font-size: 10px;
          letter-spacing: 0.04em;
          transition: all 0.3s;
        }
        .light-mode .dropdown-id {
          background: rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.08);
          color: rgba(0,0,0,0.4);
        }
        .dark-mode .dropdown-id {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.4);
        }

        .dropdown-links { padding: 6px; }
        .dropdown-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 9px;
          font-size: 13px; font-weight: 500;
          text-decoration: none;
          transition: all 0.15s;
          cursor: pointer; border: none; background: none;
          width: 100%; text-align: left; font-family: 'DM Sans', sans-serif;
        }
        .light-mode .dropdown-link { color: rgba(0,0,0,0.6); }
        .dark-mode .dropdown-link { color: rgba(255,255,255,0.6); }
        
        .light-mode .dropdown-link:hover { background: rgba(0,0,0,0.05); color: #1a1a2e; }
        .dark-mode .dropdown-link:hover { background: rgba(255,255,255,0.06); color: #fff; }
        
        .dropdown-link.danger { color: #fc8181; }
        .light-mode .dropdown-link.danger:hover { background: rgba(210,16,52,0.08); color: #dc3545; }
        .dark-mode .dropdown-link.danger:hover { background: rgba(210,16,52,0.1); color: #ff6b6b; }
        
        .dropdown-link-icon { font-size: 15px; width: 20px; text-align: center; }

        .dropdown-divider {
          height: 1px;
          margin: 4px 6px;
          transition: background 0.3s;
        }
        .light-mode .dropdown-divider { background: rgba(0,0,0,0.06); }
        .dark-mode .dropdown-divider { background: rgba(255,255,255,0.06); }

        /* ── Mobile hamburger ── */
        .hamburger {
          display: none;
          flex-direction: column; justify-content: center;
          gap: 5px; width: 36px; height: 36px;
          border-radius: 9px; cursor: pointer; padding: 8px;
          transition: all 0.2s;
        }
        .light-mode .hamburger {
          background: rgba(0,0,0,0.04);
          border: 1px solid rgba(0,0,0,0.1);
        }
        .dark-mode .hamburger {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .light-mode .hamburger:hover { background: rgba(0,0,0,0.08); }
        .dark-mode .hamburger:hover { background: rgba(255,255,255,0.09); }
        @media (max-width: 640px) { .hamburger { display: flex; } }

        .ham-bar {
          width: 100%; height: 1.5px;
          border-radius: 99px;
          transition: transform 0.25s, opacity 0.25s;
          transform-origin: center;
        }
        .light-mode .ham-bar { background: rgba(0,0,0,0.7); }
        .dark-mode .ham-bar { background: rgba(255,255,255,0.7); }
        .hamburger.open .ham-bar:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
        .hamburger.open .ham-bar:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .hamburger.open .ham-bar:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

        /* ── Mobile drawer ── */
        .mobile-drawer {
          display: none;
          flex-direction: column;
          padding: 10px;
          animation: slideDown 0.25s ease;
        }
        .light-mode .mobile-drawer {
          background: rgba(255,255,255,0.98);
          border-top: 1px solid rgba(0,0,0,0.06);
        }
        .dark-mode .mobile-drawer {
          background: rgba(8,8,8,0.98);
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) { .mobile-drawer { display: flex; } }

        .mobile-user-header {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 10px 14px;
          margin-bottom: 6px;
          transition: border-color 0.3s;
        }
        .light-mode .mobile-user-header { border-bottom: 1px solid rgba(0,0,0,0.06); }
        .dark-mode .mobile-user-header { border-bottom: 1px solid rgba(255,255,255,0.06); }
        
        .mobile-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: linear-gradient(135deg, #d21034, #007a33);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 700; color: #fff;
          flex-shrink: 0;
        }
        .mobile-user-name {
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 700;
          transition: color 0.3s;
        }
        .light-mode .mobile-user-name { color: #1a1a2e; }
        .dark-mode .mobile-user-name { color: #fff; }
        
        .mobile-user-email {
          font-size: 11px;
          margin-top: 1px;
          transition: color 0.3s;
        }
        .light-mode .mobile-user-email { color: rgba(0,0,0,0.35); }
        .dark-mode .mobile-user-email { color: rgba(255,255,255,0.35); }

        .mobile-nav-link {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 12px; border-radius: 10px;
          font-size: 14px; font-weight: 500;
          text-decoration: none;
          transition: all 0.15s;
        }
        .light-mode .mobile-nav-link { color: rgba(0,0,0,0.55); }
        .dark-mode .mobile-nav-link { color: rgba(255,255,255,0.55); }
        
        .light-mode .mobile-nav-link:hover,
        .light-mode .mobile-nav-link.active {
          background: rgba(0,0,0,0.07);
          color: #1a1a2e;
        }
        .dark-mode .mobile-nav-link:hover,
        .dark-mode .mobile-nav-link.active {
          background: rgba(255,255,255,0.07);
          color: #fff;
        }
        .mobile-nav-link.active { border-left: 2px solid #d21034; padding-left: 10px; }
        .mobile-nav-icon { font-size: 16px; width: 22px; text-align: center; }

        .mobile-logout {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 11px 12px; border-radius: 10px;
          font-size: 14px; font-weight: 500; color: #fc8181;
          background: none; border: none; cursor: pointer; text-align: left;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s;
          margin-top: 4px;
        }
        .light-mode .mobile-logout:hover { background: rgba(210,16,52,0.08); }
        .dark-mode .mobile-logout:hover { background: rgba(210,16,52,0.1); }

        /* ── Logout confirm modal ── */
        .logout-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 200; padding: 1rem;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .logout-card {
          border-radius: 18px; overflow: hidden;
          max-width: 340px; width: 100%;
          animation: popIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275);
        }
        .light-mode .logout-card {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.1);
        }
        .dark-mode .logout-card {
          background: #16213e;
          border: 1px solid rgba(255,255,255,0.1);
        }
        @keyframes popIn { from { opacity:0; transform:scale(0.88); } to { opacity:1; transform:none; } }
        .logout-stripe { height: 3px; background: linear-gradient(90deg,#000,#d21034,#007a33); }
        .logout-inner { padding: 1.75rem; text-align: center; }
        .logout-icon { font-size: 32px; margin-bottom: 10px; }
        .logout-title {
          font-family: 'Sora', sans-serif;
          font-size: 17px; font-weight: 700;
          transition: color 0.3s;
        }
        .light-mode .logout-title { color: #1a1a2e; }
        .dark-mode .logout-title { color: #fff; }
        
        .logout-sub {
          font-size: 13px;
          margin-bottom: 1.5rem; line-height: 1.6;
          transition: color 0.3s;
        }
        .light-mode .logout-sub { color: rgba(0,0,0,0.35); }
        .dark-mode .logout-sub { color: rgba(255,255,255,0.35); }
        
        .logout-actions { display: flex; gap: 10px; }
        .logout-cancel {
          flex: 1; padding: 10px; border-radius: 9px; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500;
          transition: all 0.2s;
        }
        .light-mode .logout-cancel {
          background: rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.1);
          color: rgba(0,0,0,0.6);
        }
        .dark-mode .logout-cancel {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6);
        }
        .light-mode .logout-cancel:hover { background: rgba(0,0,0,0.09); }
        .dark-mode .logout-cancel:hover { background: rgba(255,255,255,0.09); }
        
        .logout-confirm {
          flex: 1; padding: 10px; border-radius: 9px; cursor: pointer;
          background: #d21034; border: none; color: #fff;
          font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600;
          transition: background 0.2s, transform 0.15s;
        }
        .logout-confirm:hover { background: #b00e2a; transform: translateY(-1px); }
      `}</style>

      {/* ── Logout confirm modal ── */}
      {showLogoutConfirm && (
        <div className="logout-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="logout-card" onClick={(e) => e.stopPropagation()}>
            <div className="logout-stripe" />
            <div className="logout-inner">
              <div className="logout-icon">👋</div>
              <div className="logout-title">Sign out?</div>
              <div className="logout-sub">You'll need to sign in again to access your ballot and account.</div>
              <div className="logout-actions">
                <button className="logout-cancel" onClick={() => setShowLogoutConfirm(false)}>Stay</button>
                <button className="logout-confirm" onClick={logout}>Sign out</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className={`navbar ${isDark ? 'dark-mode' : 'light-mode'} ${scrolled ? "scrolled" : ""}`} ref={menuRef}>
        <div className="navbar-stripe" />

        <div className="navbar-inner">
          {/* Brand */}
          <Link to="/dashboard" className="navbar-brand">
            <span className="brand-flag" role="img" aria-label="Kenya flag">🇰🇪</span>
            <span className="brand-text">e<span>Vote</span></span>
            <span className="brand-divider" />
            <span className="brand-sub">Kenya</span>
          </Link>

          {/* Desktop nav links */}
          <div className="nav-links">
            <Link to="/dashboard" className={`nav-link${isActive("/dashboard") ? " active" : ""}`}>
              <span className="nav-link-icon">🗳</span> Ballot
            </Link>
            <Link to="/results" className={`nav-link${isActive("/results") ? " active" : ""}`}>
              <span className="nav-link-icon">📊</span> Results
            </Link>
          </div>

          {/* Right side: user dropdown + hamburger + theme toggle */}
          <div className="navbar-right">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Desktop user dropdown */}
            <div className="user-menu" style={{ display: "none" }}
              ref={(el) => { if (el) el.style.display = window.innerWidth > 640 ? "block" : "none"; }}
            />

            {/* Desktop: always show user btn via media query workaround */}
            <div style={{ display: "flex" }} className="desktop-user">
              <style>{`.desktop-user { display: none !important; } @media (min-width: 641px) { .desktop-user { display: flex !important; } }`}</style>
              <div className="user-menu">
                <button
                  className="user-btn"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  <div className="user-avatar">{initials}</div>
                  <span className="user-name">
                    {user?.first_name ? `${user.first_name}` : user?.email?.split("@")[0]}
                  </span>
                  <span className={`user-chevron${menuOpen ? " open" : ""}`}>▼</span>
                </button>

                {menuOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <div className="dropdown-name">
                        {user?.first_name} {user?.last_name}
                      </div>
                      <div className="dropdown-email">{user?.email}</div>
                      {user?.id_number && (
                        <div className="dropdown-id">🪪 ID: {user.id_number}</div>
                      )}
                    </div>
                    <div className="dropdown-links">
                      <Link to="/dashboard" className="dropdown-link" onClick={() => setMenuOpen(false)}>
                        <span className="dropdown-link-icon">🗳</span> Ballot
                      </Link>
                      <Link to="/results" className="dropdown-link" onClick={() => setMenuOpen(false)}>
                        <span className="dropdown-link-icon">📊</span> Results
                      </Link>
                      <div className="dropdown-divider" />
                      <button
                        className="dropdown-link danger"
                        onClick={() => { setMenuOpen(false); setShowLogoutConfirm(true); }}
                      >
                        <span className="dropdown-link-icon">🚪</span> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              className={`hamburger${menuOpen ? " open" : ""}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              style={{ display: "none" }}
              ref={(el) => { if (el) el.style.display = window.innerWidth <= 640 ? "flex" : "none"; }}
            >
              <style>{`.hamburger { display: none !important; } @media (max-width: 640px) { .hamburger { display: flex !important; } }`}</style>
              <div className="ham-bar" />
              <div className="ham-bar" />
              <div className="ham-bar" />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="mobile-drawer">
            <div className="mobile-user-header">
              <div className="mobile-avatar">{initials}</div>
              <div>
                <div className="mobile-user-name">{user?.first_name} {user?.last_name}</div>
                <div className="mobile-user-email">{user?.email}</div>
              </div>
            </div>

            <Link to="/dashboard" className={`mobile-nav-link${isActive("/dashboard") ? " active" : ""}`}>
              <span className="mobile-nav-icon">🗳</span> Ballot
            </Link>
            <Link to="/results" className={`mobile-nav-link${isActive("/results") ? " active" : ""}`}>
              <span className="mobile-nav-icon">📊</span> Results
            </Link>

            <div style={{ height: 1, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", margin: "6px 0" }} />

            <button className="mobile-logout" onClick={() => { setMenuOpen(false); setShowLogoutConfirm(true); }}>
              <span className="mobile-nav-icon">🚪</span> Sign out
            </button>
          </div>
        )}
      </nav>
    </>
  );
}