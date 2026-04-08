import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api";
import { useLoader } from "../contexts/LoaderContext";

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
      // Also revalidate confirm_password if password changes
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
    <div className="register-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .register-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background: #0a0a0a;
          background-image:
            radial-gradient(ellipse at 20% 50%, rgba(0,122,51,0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(210,16,52,0.06) 0%, transparent 50%);
          font-family: 'DM Sans', sans-serif;
        }

        .register-card {
          width: 100%;
          max-width: 900px;
          background: #111;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr 380px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.5s ease, transform 0.5s ease;
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
        .register-brand-text h1 {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.3px;
          line-height: 1;
        }
        .register-brand-text p {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          margin-top: 2px;
        }

        .progress-section { margin-bottom: 0.5rem; }
        .progress-labels {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .progress-labels span {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
        }
        .progress-labels strong {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
        }
        .progress-track {
          height: 4px;
          background: rgba(255,255,255,0.08);
          border-radius: 99px;
          overflow: hidden;
        }
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
          color: rgba(255,255,255,0.4);
          padding-left: 2px;
        }

        .field-input-wrap { position: relative; }
        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 11px 40px 11px 14px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }
        .field-input:focus {
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 3px rgba(0,122,51,0.15);
        }
        .field-input.is-valid { border-color: rgba(0,180,80,0.5); }
        .field-input.is-error { border-color: rgba(210,16,52,0.6); box-shadow: 0 0 0 3px rgba(210,16,52,0.08); }

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
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          padding: 2px;
          font-size: 13px;
          transition: color 0.2s;
          line-height: 1;
        }
        .field-toggle-btn:hover { color: rgba(255,255,255,0.7); }

        .field-error {
          font-size: 11px;
          color: #fc6b6b;
          padding-left: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

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
        .strength-label {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          transition: color 0.3s;
        }

        /* ---- ERROR BANNER ---- */
        .error-banner {
          background: rgba(210,16,52,0.12);
          border: 1px solid rgba(210,16,52,0.3);
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #fc8181;
        }

        /* ---- SUBMIT BUTTON ---- */
        .submit-btn {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 10px;
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
          background: #111;
          border: 1px solid rgba(0,180,80,0.3);
          border-radius: 18px;
          padding: 2.5rem;
          max-width: 380px;
          width: 90%;
          text-align: center;
          animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
        }
        .success-icon {
          width: 64px;
          height: 64px;
          background: rgba(0,122,51,0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.25rem;
          font-size: 28px;
        }
        .success-title {
          font-family: 'Sora', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 8px;
        }
        .success-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
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
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .success-btn-secondary:hover { background: rgba(255,255,255,0.12); }

        /* ---- RIGHT SIDE PANEL ---- */
        .register-side {
          background: #0e0e0e;
          border-left: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
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
          background: rgba(255,255,255,0.1);
          transition: background 0.4s, transform 0.3s;
        }
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
          border: 2px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
        }

        .side-heading {
          font-family: 'Sora', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 10px;
          line-height: 1.2;
          position: relative;
          z-index: 1;
        }
        .side-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
          line-height: 1.7;
          margin-bottom: 2rem;
          position: relative;
          z-index: 1;
        }
        .side-login-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 11px 28px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 10px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
          position: relative;
          z-index: 1;
          cursor: pointer;
        }
        .side-login-btn:hover {
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
                <p>Kenya National ID System</p>
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
                      {/* Password toggle */}
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
                      {/* Valid / error icon */}
                      {isValid && <span className="field-status-icon" style={{ color: "#4ade80" }}>✓</span>}
                      {isError && !isPw && <span className="field-status-icon" style={{ color: "#fc6b6b" }}>✕</span>}
                    </div>

                    {/* Password strength */}
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
          {/* Decorative background */}
          <svg className="side-bg-art" viewBox="0 0 380 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="190" cy="300" r="200" fill="none" stroke="rgba(0,122,51,0.06)" strokeWidth="1"/>
            <circle cx="190" cy="300" r="150" fill="none" stroke="rgba(210,16,52,0.05)" strokeWidth="1"/>
            <circle cx="190" cy="300" r="100" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <line x1="0" y1="0" x2="380" y2="600" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
            <line x1="380" y1="0" x2="0" y2="600" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </svg>

          {/* Progress dots */}
          <div className="side-dots">
            {FIELDS.map(({ name }, i) => {
              const done = !validateField(name, formData[name]);
              const colors = ["#111","#d21034","#007a33"];
              const bg = done ? colors[i % 3 === 0 ? 2 : i % 3 === 1 ? 1 : 2] : "rgba(255,255,255,0.1)";
              return <div key={name} className={`side-dot${done ? " active" : ""}`} style={{ background: bg }} />;
            })}
          </div>

          {/* Circular progress */}
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