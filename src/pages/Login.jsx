import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api";
import { useLoader } from "../contexts/LoaderContext";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const { theme } = useTheme();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [shake, setShake]       = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    emailRef.current?.focus();
  }, []);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwValid    = password.length >= 4;
  const canSubmit  = emailValid && pwValid && !success;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    showLoader();
    try {
      const res = await loginUser({ email, password });
      const { access, refresh, user } = res;
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      localStorage.setItem("user", JSON.stringify(user));
      onLogin(user, { access, refresh });
      setSuccess(true);
      setTimeout(() => { hideLoader(); navigate("/dashboard"); }, 1200);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.join(" ") ||
        "Incorrect email or password.";
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      hideLoader();
    }
  };

  return (
    <div className="login-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          font-family: 'DM Sans', sans-serif;
        }

        /* Light mode background */
        .login-page.light-mode {
          background: linear-gradient(135deg, #f5f7fa 0%, #e9edf2 100%);
        }

        /* Dark mode background - lighter than before */
        .login-page.dark-mode {
          background: #1a1a2e;
          background-image: 
            radial-gradient(ellipse at 30% 40%, rgba(210,16,52,0.08) 0%, transparent 55%),
            radial-gradient(ellipse at 75% 70%, rgba(0,122,51,0.06) 0%, transparent 55%);
        }

        /* ── Card ── */
        .login-card {
          width: 100%;
          max-width: 420px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.45s ease, transform 0.45s ease;
        }

        /* Light mode card */
        .light-mode .login-card {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 24px;
          box-shadow: 0 20px 35px -10px rgba(0,0,0,0.1);
        }

        /* Dark mode card */
        .dark-mode .login-card {
          background: #16213e;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          box-shadow: 0 20px 35px -10px rgba(0,0,0,0.3);
        }

        .login-card.mounted { opacity: 1; transform: translateY(0); }
        .login-card.shake {
          animation: shake 0.5s cubic-bezier(0.36,0.07,0.19,0.97);
        }
        @keyframes shake {
          10%, 90%  { transform: translateX(-3px); }
          20%, 80%  { transform: translateX(5px); }
          30%, 50%, 70% { transform: translateX(-5px); }
          40%, 60%  { transform: translateX(5px); }
        }

        /* ── Top stripe ── */
        .login-stripe {
          height: 4px;
          background: linear-gradient(90deg, #000 0%, #d21034 50%, #007a33 100%);
          border-radius: 24px 24px 0 0;
        }

        /* ── Inner padding ── */
        .login-inner { padding: 2.25rem 2rem 2rem; }

        /* ── Header ── */
        .login-header { text-align: center; margin-bottom: 2rem; }
        .login-brand {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1.25rem;
        }
        .login-flag { font-size: 26px; }
        .login-brand-label {
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .light-mode .login-brand-label { color: rgba(0,0,0,0.5); }
        .dark-mode .login-brand-label { color: rgba(255,255,255,0.35); }

        .login-title {
          font-family: 'Sora', sans-serif;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.4px;
          margin-bottom: 6px;
        }
        .light-mode .login-title { color: #1a1a2e; }
        .dark-mode .login-title { color: #fff; }

        .login-sub {
          font-size: 13px;
        }
        .light-mode .login-sub { color: rgba(0,0,0,0.5); }
        .dark-mode .login-sub { color: rgba(255,255,255,0.35); }

        /* ── Fields ── */
        .login-fields { display: flex; flex-direction: column; gap: 14px; margin-bottom: 1.25rem; }

        .field-wrap { display: flex; flex-direction: column; gap: 5px; }
        .field-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          padding-left: 2px;
        }
        .light-mode .field-label { color: rgba(0,0,0,0.6); }
        .dark-mode .field-label { color: rgba(255,255,255,0.4); }

        .field-input-wrap { position: relative; }
        .field-input {
          width: 100%;
          border-radius: 12px;
          padding: 12px 42px 12px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .light-mode .field-input {
          background: #f8f9fa;
          border: 1px solid #e0e4e8;
          color: #1a1a2e;
        }
        .dark-mode .field-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
        }
        .field-input::placeholder {
          .light-mode & { color: #adb5bd; }
          .dark-mode & { color: rgba(255,255,255,0.2); }
        }
        .field-input:focus {
          .light-mode & {
            border-color: #007a33;
            box-shadow: 0 0 0 3px rgba(0,122,51,0.1);
            background: #ffffff;
          }
          .dark-mode & {
            border-color: rgba(255,255,255,0.28);
            background: rgba(255,255,255,0.07);
            box-shadow: 0 0 0 3px rgba(0,122,51,0.14);
          }
        }
        .field-input.is-valid {
          .light-mode & { border-color: #28a745; }
          .dark-mode & { border-color: rgba(0,180,80,0.45); }
        }

        .field-icon {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          pointer-events: none;
          transition: color 0.2s;
        }
        .light-mode .field-icon { color: rgba(0,0,0,0.3); }
        .dark-mode .field-icon { color: rgba(255,255,255,0.3); }
        .field-icon.valid { color: #28a745; }

        .field-toggle {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          padding: 2px;
          line-height: 1;
          transition: color 0.2s;
        }
        .light-mode .field-toggle { color: rgba(0,0,0,0.3); }
        .dark-mode .field-toggle { color: rgba(255,255,255,0.3); }
        .light-mode .field-toggle:hover { color: rgba(0,0,0,0.6); }
        .dark-mode .field-toggle:hover { color: rgba(255,255,255,0.65); }

        /* ── Error banner ── */
        .error-banner {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          border-radius: 12px;
          padding: 10px 13px;
          margin-bottom: 14px;
          font-size: 13px;
          animation: fadeIn 0.25s ease;
        }
        .light-mode .error-banner {
          background: rgba(220,53,69,0.08);
          border: 1px solid rgba(220,53,69,0.2);
          color: #dc3545;
        }
        .dark-mode .error-banner {
          background: rgba(210,16,52,0.1);
          border: 1px solid rgba(210,16,52,0.28);
          color: #fc8181;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

        /* ── Submit button ── */
        .submit-btn {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 12px;
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          background: linear-gradient(90deg, #000 0%, #d21034 50%, #007a33 100%);
          background-size: 200% 100%;
          background-position: 0% 0%;
          transition: background-position 0.4s ease, transform 0.15s, opacity 0.2s;
          position: relative;
          overflow: hidden;
        }
        .submit-btn:not(:disabled):hover {
          background-position: 100% 0%;
          transform: translateY(-1px);
        }
        .submit-btn:not(:disabled):active { transform: scale(0.98); }
        .submit-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .submit-btn.success-state {
          background: #007a33 !important;
          background-image: none !important;
        }

        /* ── Divider ── */
        .divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 1.25rem 0;
        }
        .divider-line {
          flex: 1;
          height: 1px;
        }
        .light-mode .divider-line { background: rgba(0,0,0,0.08); }
        .dark-mode .divider-line { background: rgba(255,255,255,0.07); }
        .divider-text {
          font-size: 11px;
          white-space: nowrap;
        }
        .light-mode .divider-text { color: rgba(0,0,0,0.4); }
        .dark-mode .divider-text { color: rgba(255,255,255,0.25); }

        /* ── Footer ── */
        .login-footer { text-align: center; }
        .login-footer p {
          font-size: 13px;
        }
        .light-mode .login-footer p { color: rgba(0,0,0,0.5); }
        .dark-mode .login-footer p { color: rgba(255,255,255,0.35); }
        .login-footer a {
          color: #d21034;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }
        .login-footer a:hover { color: #ff3355; }

        /* ── Security badge ── */
        .security-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          margin-top: 1.25rem;
          font-size: 11px;
        }
        .light-mode .security-badge { color: rgba(0,0,0,0.3); }
        .dark-mode .security-badge { color: rgba(255,255,255,0.2); }

        /* ── Success checkmark ── */
        .success-ring {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(0,200,80,0.2);
          margin-right: 4px;
          font-size: 11px;
          vertical-align: middle;
        }
      `}</style>

      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className={`login-page ${theme === 'dark' ? 'dark-mode' : 'light-mode'}`}>
        <div className={`login-card${mounted ? " mounted" : ""}${shake ? " shake" : ""}`}>
          <div className="login-stripe" />

          <div className="login-inner">
            {/* Header */}
            <div className="login-header">
              <div className="login-brand">
                <span className="login-flag" role="img" aria-label="Kenyan flag">🇰🇪</span>
                <span className="login-brand-label">eVoting System</span>
              </div>
              <h1 className="login-title">Welcome back</h1>
              <p className="login-sub">Sign in to your voting account</p>
            </div>

            {/* Error */}
            {error && (
              <div className="error-banner">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="login-fields">
                {/* Email */}
                <div className="field-wrap">
                  <label className="field-label" htmlFor="login-email">Email Address</label>
                  <div className="field-input-wrap">
                    <input
                      id="login-email"
                      ref={emailRef}
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      required
                      autoComplete="email"
                      className={`field-input${emailValid ? " is-valid" : email ? " is-filled" : ""}`}
                    />
                    <span className={`field-icon${emailValid ? " valid" : ""}`}>
                      {emailValid ? "✓" : "✉"}
                    </span>
                  </div>
                </div>

                {/* Password */}
                <div className="field-wrap">
                  <label className="field-label" htmlFor="login-password">Password</label>
                  <div className="field-input-wrap">
                    <input
                      id="login-password"
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      required
                      autoComplete="current-password"
                      className={`field-input${pwValid ? " is-valid" : password ? " is-filled" : ""}`}
                      style={{ paddingRight: "42px" }}
                    />
                    <button
                      type="button"
                      className="field-toggle"
                      onClick={() => setShowPw((p) => !p)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? "👁" : "🙈"}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={`submit-btn${success ? " success-state" : ""}`}
                disabled={!canSubmit}
              >
                {success
                  ? <><span className="success-ring">✓</span> Redirecting…</>
                  : canSubmit
                    ? "Sign in →"
                    : "Enter your credentials"}
              </button>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">New here?</span>
              <div className="divider-line" />
            </div>

            <div className="login-footer">
              <p>
                Don't have an account?{" "}
                <Link to="/register">Create one</Link>
              </p>
            </div>

            <div className="security-badge">
              <span>🔒</span>
              <span>Secured · 256-bit encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}