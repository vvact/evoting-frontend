import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api";
import { useLoader } from "../contexts/LoaderContext";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";

const FIELDS = [
  { name: "first_name",       label: "First Name",       type: "text",     col: "half", placeholder: "e.g. Amara",          autocomplete: "given-name" },
  { name: "middle_name",      label: "Middle Name",      type: "text",     col: "half", placeholder: "e.g. Wanjiru",         autocomplete: "additional-name" },
  { name: "last_name",        label: "Last Name",        type: "text",     col: "full", placeholder: "e.g. Kamau",           autocomplete: "family-name" },
  { name: "email",            label: "Email Address",    type: "email",    col: "full", placeholder: "you@example.com",      autocomplete: "email" },
  { name: "id_number",        label: "National ID",      type: "text",     col: "full", placeholder: "7 or 8-digit ID number", autocomplete: "off" },
  { name: "password",         label: "Password",         type: "password", col: "half", placeholder: "Min. 4 characters",   autocomplete: "new-password" },
  { name: "confirm_password", label: "Confirm Password", type: "password", col: "half", placeholder: "Repeat password",     autocomplete: "new-password" },
];

function pwStrength(v) {
  if (!v) return 0;
  let s = 0;
  if (v.length >= 4) s++;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v) || /[0-9]/.test(v)) s++;
  if (/[^a-zA-Z0-9]/.test(v)) s++;
  return s;
}

const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColor = ["", "#e53e3e", "#dd6b20", "#38a169", "#2f855a"];

export default function Register({ setVerifyEmail }) {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const { theme } = useTheme();
  const firstInputRef = useRef(null);

  const [formData, setFormData] = useState({
    first_name: "", middle_name: "", last_name: "",
    email: "", id_number: "", password: "", confirm_password: "",
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPw, setShowPw] = useState({ password: false, confirm_password: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    firstInputRef.current?.focus();
  }, []);

  const validateField = (name, value, data = formData) => {
    if (["first_name", "middle_name", "last_name"].includes(name)) {
      if (!value || value.trim().length < 2) return `${name.replace(/_/g, " ")} must have at least 2 letters.`;
    }
    if (name === "id_number") {
      if (!/^\d{7,8}$/.test(value)) return "ID number must be 7–8 digits.";
    }
    if (name === "password") {
      if (value && value.length < 4) return "Password must be at least 4 characters.";
    }
    if (name === "confirm_password") {
      if (value !== data.password) return "Passwords do not match.";
    }
    if (name === "email") {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address.";
    }
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = name === "id_number" ? value.replace(/\D/g, "").slice(0, 8) : value;
    const newData = { ...formData, [name]: newValue };
    setFormData(newData);
    if (touched[name]) {
      const err = validateField(name, newValue, newData);
      setErrors((prev) => ({ ...prev, [name]: err }));
      if (name === "password" && touched["confirm_password"]) {
        setErrors((prev) => ({ ...prev, confirm_password: validateField("confirm_password", newData.confirm_password, newData) }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(FIELDS.map((f) => [f.name, true]));
    setTouched(allTouched);
    const newErrors = {};
    FIELDS.forEach(({ name }) => {
      const err = validateField(name, formData[name]);
      if (err) newErrors[name] = err;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    showLoader();
    try {
      await registerUser(formData);
      setVerifyEmail(formData.email);
      setSuccessMessage("Account created! Verify your email or log in directly.");
      setShowSuccess(true);
      setTimeout(() => navigate("/verify"), 3000);
    } catch (err) {
      if (err.response?.data) setErrors(err.response.data);
      else setErrors({ non_field_errors: ["Registration failed. Please try again."] });
    } finally {
      hideLoader();
    }
  };

  const validCount = FIELDS.filter(({ name }) => !validateField(name, formData[name])).length;
  const progressPct = Math.round((validCount / FIELDS.length) * 100);
  const pwScore = pwStrength(formData.password);
  const allValid = progressPct === 100;

  return (
    <div className={`register-page ${theme === 'dark' ? 'dark-mode' : 'light-mode'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .register-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          font-family: 'DM Sans', sans-serif;
        }

        /* Light mode background */
        .register-page.light-mode {
          background: linear-gradient(135deg, #f5f7fa 0%, #e9edf2 100%);
        }

        /* Dark mode background - lighter than before */
        .register-page.dark-mode {
          background: #1a1a2e;
          background-image: 
            radial-gradient(ellipse at 20% 50%, rgba(0,122,51,0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(210,16,52,0.06) 0%, transparent 50%);
        }

        .register-card {
          width: 100%;
          max-width: 900px;
          display: grid;
          grid-template-columns: 1fr 380px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.5s ease, transform 0.5s ease;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 35px -10px rgba(0,0,0,0.1);
        }
        
        /* Light mode card */
        .light-mode .register-card {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.08);
        }
        
        /* Dark mode card */
        .dark-mode .register-card {
          background: #16213e;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 20px 35px -10px rgba(0,0,0,0.3);
        }
        
        .register-card.mounted { opacity: 1; transform: translateY(0); }

        @media (max-width: 768px) {
          .register-card { grid-template-columns: 1fr; }
          .register-side { display: none; }
        }

        /* ---- LEFT FORM PANEL ---- */
        .register-form-panel {
          padding: 2.5rem;
          overflow-y: auto;
          max-height: 90vh;
        }

        .register-header { margin-bottom: 2rem; }

        .register-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1.25rem;
        }
        .register-brand-flag { font-size: 28px; }
        .register-brand-text { font-family: 'Sora', sans-serif; }
        
        .light-mode .register-brand-text h1 { color: #1a1a2e; }
        .dark-mode .register-brand-text h1 { color: #fff; }
        
        .light-mode .register-brand-text p { color: rgba(0,0,0,0.5); }
        .dark-mode .register-brand-text p { color: rgba(255,255,255,0.4); }

        .progress-section { margin-bottom: 0.5rem; }
        .progress-labels {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        
        .light-mode .progress-labels span { color: rgba(0,0,0,0.5); }
        .dark-mode .progress-labels span { color: rgba(255,255,255,0.45); }
        
        .light-mode .progress-labels strong { color: #1a1a2e; }
        .dark-mode .progress-labels strong { color: #fff; }
        
        .progress-track {
          height: 4px;
          border-radius: 99px;
          overflow: hidden;
        }
        .light-mode .progress-track { background: rgba(0,0,0,0.08); }
        .dark-mode .progress-track { background: rgba(255,255,255,0.08); }
        
        .progress-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.5s cubic-bezier(0.4,0,0.2,1), background 0.5s;
        }

        /* ---- FIELDS ---- */
        .fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 1rem;
        }
        .field-wrap { display: flex; flex-direction: column; gap: 5px; }
        .field-wrap.full { grid-column: 1 / -1; }

        .field-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding-left: 2px;
        }
        .light-mode .field-label { color: rgba(0,0,0,0.6); }
        .dark-mode .field-label { color: rgba(255,255,255,0.4); }

        .field-input-wrap { position: relative; }
        .field-input {
          width: 100%;
          border-radius: 12px;
          padding: 11px 40px 11px 14px;
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
        
        .light-mode .field-input::placeholder { color: #adb5bd; }
        .dark-mode .field-input::placeholder { color: rgba(255,255,255,0.2); }
        
        .field-input:focus {
          .light-mode & {
            border-color: #007a33;
            box-shadow: 0 0 0 3px rgba(0,122,51,0.1);
            background: #ffffff;
          }
          .dark-mode & {
            border-color: rgba(255,255,255,0.3);
            background: rgba(255,255,255,0.07);
            box-shadow: 0 0 0 3px rgba(0,122,51,0.15);
          }
        }
        
        .light-mode .field-input.is-valid { border-color: #28a745; }
        .dark-mode .field-input.is-valid { border-color: rgba(0,180,80,0.5); }
        
        .light-mode .field-input.is-error { border-color: #dc3545; box-shadow: 0 0 0 3px rgba(220,53,69,0.08); }
        .dark-mode .field-input.is-error { border-color: rgba(210,16,52,0.6); box-shadow: 0 0 0 3px rgba(210,16,52,0.08); }

        .field-status-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          pointer-events: none;
          transition: opacity 0.2s;
        }
        
        .field-toggle-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px;
          font-size: 13px;
          transition: color 0.2s;
          line-height: 1;
        }
        .light-mode .field-toggle-btn { color: rgba(0,0,0,0.4); }
        .dark-mode .field-toggle-btn { color: rgba(255,255,255,0.35); }
        .light-mode .field-toggle-btn:hover { color: rgba(0,0,0,0.7); }
        .dark-mode .field-toggle-btn:hover { color: rgba(255,255,255,0.7); }

        .field-error {
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
          padding-left: 2px;
        }
        .light-mode .field-error { color: #dc3545; }
        .dark-mode .field-error { color: #fc6b6b; }

        /* ---- STRENGTH METER ---- */
        .strength-meter { margin-top: 6px; }
        .strength-bars {
          display: flex;
          gap: 4px;
          margin-bottom: 3px;
        }
        .strength-bar {
          flex: 1;
          height: 3px;
          border-radius: 99px;
          background: rgba(255,255,255,0.08);
          transition: background 0.3s;
        }
        .light-mode .strength-bar { background: rgba(0,0,0,0.1); }
        .strength-label {
          font-size: 11px;
          transition: color 0.3s;
        }
        .light-mode .strength-label { color: rgba(0,0,0,0.5); }
        .dark-mode .strength-label { color: rgba(255,255,255,0.4); }

        /* ---- ERROR BANNER ---- */
        .error-banner {
          border-radius: 12px;
          padding: 10px 14px;
          margin-bottom: 16px;
          font-size: 13px;
        }
        .light-mode .error-banner {
          background: rgba(220,53,69,0.08);
          border: 1px solid rgba(220,53,69,0.2);
          color: #dc3545;
        }
        .dark-mode .error-banner {
          background: rgba(210,16,52,0.12);
          border: 1px solid rgba(210,16,52,0.3);
          color: #fc8181;
        }

        /* ---- SUBMIT BUTTON ---- */
        .submit-btn {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 12px;
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: #fff;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, opacity 0.2s;
          background: linear-gradient(90deg, #000 0%, #d21034 50%, #007a33 100%);
          background-size: 200% 100%;
          background-position: 0% 0%;
          transition: background-position 0.4s ease, transform 0.15s;
        }
        .submit-btn:not(:disabled):hover {
          background-position: 100% 0%;
          transform: translateY(-1px);
        }
        .submit-btn:not(:disabled):active { transform: scale(0.98); }
        .submit-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* ---- SUCCESS TOAST ---- */
        .success-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          animation: fadeIn 0.3s ease;
        }
        .success-card {
          border-radius: 24px;
          padding: 2.5rem;
          max-width: 380px;
          width: 90%;
          text-align: center;
          animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
        }
        .light-mode .success-card {
          background: #ffffff;
          border: 1px solid rgba(0,122,51,0.2);
        }
        .dark-mode .success-card {
          background: #16213e;
          border: 1px solid rgba(0,180,80,0.3);
        }
        
        .success-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.25rem;
          font-size: 28px;
        }
        .light-mode .success-icon { background: rgba(0,122,51,0.1); }
        .dark-mode .success-icon { background: rgba(0,122,51,0.15); }
        
        .success-title {
          font-family: 'Sora', sans-serif;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .light-mode .success-title { color: #1a1a2e; }
        .dark-mode .success-title { color: #fff; }
        
        .success-sub {
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
        .light-mode .success-sub { color: rgba(0,0,0,0.6); }
        .dark-mode .success-sub { color: rgba(255,255,255,0.5); }
        
        .success-actions { display: flex; gap: 10px; justify-content: center; }
        .success-btn-primary {
          padding: 10px 22px;
          background: #007a33;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .success-btn-primary:hover { background: #006129; }
        .success-btn-secondary {
          padding: 10px 22px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .light-mode .success-btn-secondary {
          background: rgba(0,0,0,0.05);
          color: rgba(0,0,0,0.7);
          border: 1px solid rgba(0,0,0,0.1);
        }
        .dark-mode .success-btn-secondary {
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .light-mode .success-btn-secondary:hover { background: rgba(0,0,0,0.1); }
        .dark-mode .success-btn-secondary:hover { background: rgba(255,255,255,0.12); }

        /* ---- RIGHT SIDE PANEL ---- */
        .register-side {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .light-mode .register-side {
          background: #f8f9fa;
          border-left: 1px solid rgba(0,0,0,0.06);
        }
        .dark-mode .register-side {
          background: #0f1423;
          border-left: 1px solid rgba(255,255,255,0.06);
        }

        .side-bg-art {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .side-dots {
          display: flex;
          gap: 5px;
          justify-content: center;
          margin-bottom: 2rem;
        }
        .side-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          transition: background 0.4s, transform 0.3s;
        }
        .light-mode .side-dot { background: rgba(0,0,0,0.1); }
        .dark-mode .side-dot { background: rgba(255,255,255,0.1); }
        .side-dot.active { transform: scale(1.4); }

        .side-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          margin: 0 auto 1.25rem;
          position: relative;
          z-index: 1;
        }
        .light-mode .side-avatar {
          background: rgba(0,0,0,0.04);
          border: 2px solid rgba(0,0,0,0.08);
        }
        .dark-mode .side-avatar {
          background: rgba(255,255,255,0.04);
          border: 2px solid rgba(255,255,255,0.1);
        }

        .side-heading {
          font-family: 'Sora', sans-serif;
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 10px;
          line-height: 1.2;
          position: relative;
          z-index: 1;
        }
        .light-mode .side-heading { color: #1a1a2e; }
        .dark-mode .side-heading { color: #fff; }
        
        .side-sub {
          font-size: 13px;
          line-height: 1.7;
          margin-bottom: 2rem;
          position: relative;
          z-index: 1;
        }
        .light-mode .side-sub { color: rgba(0,0,0,0.5); }
        .dark-mode .side-sub { color: rgba(255,255,255,0.4); }
        
        .side-login-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 11px 28px;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
          position: relative;
          z-index: 1;
          cursor: pointer;
        }
        .light-mode .side-login-btn {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.15);
          color: #1a1a2e;
        }
        .dark-mode .side-login-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
        }
        .light-mode .side-login-btn:hover {
          background: rgba(0,0,0,0.05);
          border-color: rgba(0,0,0,0.25);
          transform: translateY(-1px);
        }
        .dark-mode .side-login-btn:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.35);
          transform: translateY(-1px);
        }

        .side-progress-ring {
          position: relative;
          z-index: 1;
          margin-bottom: 1.5rem;
        }
        .side-progress-ring svg { transform: rotate(-90deg); }

        /* ---- ANIMATIONS ---- */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }

        .field-wrap { animation: fieldIn 0.4s ease both; }
        @keyframes fieldIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* ── SUCCESS OVERLAY ── */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-card">
            <div className="success-icon">🎉</div>
            <div className="success-title">You're in!</div>
            <div className="success-sub">{successMessage}<br />Redirecting you to verify your email…</div>
            <div className="success-actions">
              <button className="success-btn-primary" onClick={() => navigate("/verify")}>Verify Email</button>
              <button className="success-btn-secondary" onClick={() => navigate("/login")}>Log In</button>
            </div>
          </div>
        </div>
      )}

      <div className={`register-card ${mounted ? "mounted" : ""}`}>

        {/* ── LEFT: FORM ── */}
        <div className="register-form-panel">
          <div className="register-header">
            <div className="register-brand">
              <span className="register-brand-flag" role="img" aria-label="Kenyan flag">🇰🇪</span>
              <div className="register-brand-text">
                <h1>Create Account</h1>
                <p>Kenya eVoting System</p>
              </div>
            </div>
            <div className="progress-section">
              <div className="progress-labels">
                <span>Form progress</span>
                <strong>{progressPct}%</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progressPct}%`,
                    background: progressPct === 100
                      ? "#007a33"
                      : `linear-gradient(90deg, #d21034, #007a33)`,
                  }}
                />
              </div>
            </div>
          </div>

          {errors.non_field_errors && (
            <div className="error-banner">⚠ {errors.non_field_errors.join(" ")}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="fields-grid">
              {FIELDS.map(({ name, label, type, col, placeholder, autocomplete }, idx) => {
                const isValid = touched[name] && !errors[name] && formData[name];
                const isError = touched[name] && errors[name];
                const isPw = type === "password";
                const inputType = isPw ? (showPw[name] ? "text" : "password") : type;
                const delay = `${idx * 0.05}s`;

                return (
                  <div
                    key={name}
                    className={`field-wrap${col === "full" ? " full" : ""}`}
                    style={{ animationDelay: delay }}
                  >
                    <label className="field-label" htmlFor={name}>{label}</label>
                    <div className="field-input-wrap">
                      <input
                        id={name}
                        ref={idx === 0 ? firstInputRef : null}
                        type={inputType}
                        name={name}
                        value={formData[name]}
                        placeholder={placeholder}
                        autoComplete={autocomplete}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        className={`field-input${isValid ? " is-valid" : ""}${isError ? " is-error" : ""}`}
                        style={isPw ? { paddingRight: "72px" } : {}}
                      />
                      {isPw && (
                        <button
                          type="button"
                          className="field-toggle-btn"
                          style={{ right: isValid || isError ? "34px" : "12px" }}
                          onClick={() => setShowPw((p) => ({ ...p, [name]: !p[name] }))}
                          aria-label={showPw[name] ? "Hide password" : "Show password"}
                        >
                          {showPw[name] ? "👁" : "🙈"}
                        </button>
                      )}
                      {isValid && <span className="field-status-icon" style={{ color: "#28a745" }}>✓</span>}
                      {isError && !isPw && <span className="field-status-icon" style={{ color: "#dc3545" }}>✕</span>}
                    </div>

                    {name === "password" && formData.password && (
                      <div className="strength-meter">
                        <div className="strength-bars">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="strength-bar"
                              style={{ background: i <= pwScore ? strengthColor[pwScore] : undefined }}
                            />
                          ))}
                        </div>
                        <span className="strength-label" style={{ color: strengthColor[pwScore] }}>
                          {strengthLabel[pwScore]}
                        </span>
                      </div>
                    )}

                    {isError && (
                      <div className="field-error">
                        <span>⚠</span> {errors[name]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={!allValid}
            >
              {allValid ? "Create my account →" : `Complete ${FIELDS.length - validCount} more field${FIELDS.length - validCount !== 1 ? "s" : ""}`}
            </button>
          </form>
        </div>

        {/* ── RIGHT: SIDE PANEL ── */}
        <div className="register-side">
          <svg className="side-bg-art" viewBox="0 0 380 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="190" cy="300" r="200" fill="none" stroke="rgba(0,122,51,0.06)" strokeWidth="1"/>
            <circle cx="190" cy="300" r="150" fill="none" stroke="rgba(210,16,52,0.05)" strokeWidth="1"/>
            <circle cx="190" cy="300" r="100" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <line x1="0" y1="0" x2="380" y2="600" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
            <line x1="380" y1="0" x2="0" y2="600" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </svg>

          <div className="side-dots">
            {FIELDS.map(({ name }, i) => {
              const done = !validateField(name, formData[name]);
              const colors = ["#111","#d21034","#007a33"];
              const bg = done ? colors[i % 3 === 0 ? 2 : i % 3 === 1 ? 1 : 2] : "rgba(255,255,255,0.1)";
              return <div key={name} className={`side-dot${done ? " active" : ""}`} style={{ background: bg }} />;
            })}
          </div>

          <div className="side-progress-ring">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={progressPct === 100 ? "#007a33" : "#d21034"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressPct / 100)}`}
                style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1), stroke 0.5s" }}
                transform="rotate(-90 50 50)"
              />
              <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
                style={{ fill: "#fff", fontSize: "16px", fontWeight: 700, fontFamily: "Sora, sans-serif" }}>
                {progressPct}%
              </text>
            </svg>
          </div>

          <div className="side-avatar">👤</div>
          <div className="side-heading">Already have<br />an account?</div>
          <div className="side-sub">
            Sign in to access your dashboard<br />and manage your profile.
          </div>

          <Link to="/login" className="side-login-btn">
            Log in <span>→</span>
          </Link>
        </div>

      </div>
    </div>
  );
}