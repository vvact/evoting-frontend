import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PublicAPI } from "../api";

const OTP_LENGTH = 6;

export default function Verify({ email, setVerifyEmail }) {
  const navigate = useNavigate();

  const [digits, setDigits]           = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess]         = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [mounted, setMounted]         = useState(false);
  const [shake, setShake]             = useState(false);
  const [expiresAt, setExpiresAt]     = useState(() => {
    const saved = localStorage.getItem("otpExpiresAt");
    return saved ? new Date(saved) : new Date(Date.now() + 12 * 60 * 60 * 1000);
  });
  const [timer, setTimer]             = useState("");
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate("/register");
    setMounted(true);
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    const id = setInterval(() => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) { setTimer("Expired"); clearInterval(id); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimer(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  useEffect(() => {
    localStorage.setItem("otpExpiresAt", expiresAt);
  }, [expiresAt]);

  const handleDigit = (i, val) => {
    const cleaned = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = cleaned;
    setDigits(next);
    setError("");
    if (cleaned && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next = [...digits];
    pasted.split("").forEach((ch, idx) => { next[idx] = ch; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const otp = digits.join("");
  const otpComplete = otp.length === OTP_LENGTH;
  const expired = timer === "Expired";

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otpComplete) return;
    setError("");
    setLoading(true);
    try {
      await PublicAPI.post("verify-otp/", { email, otp });
      setSuccess(true);
      setVerifyEmail("");
      localStorage.removeItem("verifyEmail");
      localStorage.removeItem("otpExpiresAt");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      const msg = err.response?.data?.detail || "Invalid code. Please try again.";
      setError(msg);
      setShake(true);
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => { setShake(false); inputRefs.current[0]?.focus(); }, 600);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError("");
    try {
      await PublicAPI.post("resend-otp/", { email });
      const newExpiry = new Date(Date.now() + 12 * 60 * 60 * 1000);
      setExpiresAt(newExpiry);
      setDigits(Array(OTP_LENGTH).fill(""));
      setResendCooldown(60);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to resend code.");
    } finally {
      setResendLoading(false);
    }
  };

  const timerDanger = timer !== "Expired" && timer.startsWith("0m") &&
    parseInt(timer.split("m")[1]) < 120;

  return (
    <div className="verify-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .verify-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background: #0a0a0a;
          background-image:
            radial-gradient(ellipse at 20% 60%, rgba(0,122,51,0.07) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 30%, rgba(210,16,52,0.06) 0%, transparent 50%);
          font-family: 'DM Sans', sans-serif;
        }

        .verify-card {
          width: 100%;
          max-width: 440px;
          background: #111;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.45s ease, transform 0.45s ease;
        }
        .verify-card.mounted { opacity: 1; transform: translateY(0); }
        .verify-card.shake { animation: shake 0.5s cubic-bezier(0.36,0.07,0.19,0.97); }
        @keyframes shake {
          10%,90%  { transform: translateX(-3px); }
          20%,80%  { transform: translateX(5px); }
          30%,50%,70% { transform: translateX(-5px); }
          40%,60%  { transform: translateX(5px); }
        }

        .verify-stripe { height: 4px; background: linear-gradient(90deg,#000 0%,#d21034 50%,#007a33 100%); }
        .verify-inner { padding: 2.25rem 2rem 2rem; }

        /* ── Header ── */
        .verify-header { text-align: center; margin-bottom: 2rem; }
        .verify-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; margin: 0 auto 1.25rem;
        }
        .verify-icon.success-icon {
          background: rgba(0,122,51,0.15);
          border-color: rgba(0,180,80,0.3);
          animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
        }
        @keyframes popIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        .verify-title {
          font-family: 'Sora', sans-serif;
          font-size: 22px; font-weight: 700;
          color: #fff; letter-spacing: -0.3px; margin-bottom: 6px;
        }
        .verify-sub { font-size: 13px; color: rgba(255,255,255,0.38); line-height: 1.6; }
        .verify-email-chip {
          display: inline-block;
          margin-top: 8px; padding: 4px 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 99px;
          font-size: 12px; color: rgba(255,255,255,0.6);
          word-break: break-all;
        }

        /* ── Timer ── */
        .timer-row {
          display: flex; align-items: center; justify-content: center;
          gap: 7px; margin-bottom: 1.5rem;
          padding: 8px 16px;
          border-radius: 99px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          font-size: 12px; font-weight: 500;
          width: fit-content; margin-left: auto; margin-right: auto;
          transition: border-color 0.4s, color 0.4s;
        }
        .timer-row.danger { border-color: rgba(210,16,52,0.35); color: #fc8181; }
        .timer-row.normal { color: rgba(255,255,255,0.45); }
        .timer-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #007a33;
          animation: pulse 1.5s infinite;
        }
        .timer-dot.danger { background: #d21034; }
        .timer-dot.expired { background: rgba(255,255,255,0.2); animation: none; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }

        /* ── OTP Boxes ── */
        .otp-row {
          display: flex; gap: 8px; justify-content: center;
          margin-bottom: 1.5rem;
        }
        .otp-box {
          width: 52px; height: 58px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          text-align: center;
          font-family: 'Sora', sans-serif;
          font-size: 22px; font-weight: 700;
          color: #fff;
          outline: none;
          caret-color: #007a33;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s;
        }
        .otp-box:focus {
          border-color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 3px rgba(0,122,51,0.18);
          transform: translateY(-2px);
        }
        .otp-box.filled {
          border-color: rgba(0,180,80,0.45);
          background: rgba(0,122,51,0.07);
        }
        .otp-box.error-box { border-color: rgba(210,16,52,0.5); }
        @media (max-width: 400px) {
          .otp-box { width: 42px; height: 50px; font-size: 18px; border-radius: 10px; }
          .otp-row { gap: 5px; }
        }

        /* ── Error banner ── */
        .error-banner {
          display: flex; align-items: center; gap: 8px;
          background: rgba(210,16,52,0.1);
          border: 1px solid rgba(210,16,52,0.28);
          border-radius: 10px; padding: 10px 13px;
          margin-bottom: 14px;
          font-size: 13px; color: #fc8181;
          animation: fadeIn 0.25s ease;
        }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:none; } }

        /* ── Submit button ── */
        .submit-btn {
          width: 100%; padding: 13px; border: none; border-radius: 10px;
          font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600;
          color: #fff; cursor: pointer;
          background: linear-gradient(90deg,#000 0%,#d21034 50%,#007a33 100%);
          background-size: 200% 100%; background-position: 0% 0%;
          transition: background-position 0.4s ease, transform 0.15s, opacity 0.2s;
        }
        .submit-btn:not(:disabled):hover { background-position: 100% 0%; transform: translateY(-1px); }
        .submit-btn:not(:disabled):active { transform: scale(0.98); }
        .submit-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .submit-btn.success-state { background: #007a33 !important; }

        /* ── Resend ── */
        .resend-section { margin-top: 1.5rem; text-align: center; }
        .resend-label { font-size: 13px; color: rgba(255,255,255,0.3); margin-bottom: 8px; }
        .resend-btn {
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          color: #d21034; transition: color 0.2s;
          padding: 0;
        }
        .resend-btn:hover:not(:disabled) { color: #ff3355; }
        .resend-btn:disabled { opacity: 0.4; cursor: not-allowed; color: rgba(255,255,255,0.3); }
        .cooldown-text { font-size: 12px; color: rgba(255,255,255,0.25); margin-top: 4px; }

        /* ── Back ── */
        .back-row {
          margin-top: 1.5rem; padding-top: 1.25rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          text-align: center;
        }
        .back-btn {
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          color: rgba(255,255,255,0.28); transition: color 0.2s;
        }
        .back-btn:hover { color: rgba(255,255,255,0.6); }

        /* ── Progress dots ── */
        .otp-progress {
          display: flex; justify-content: center; gap: 5px; margin-bottom: 1.25rem;
        }
        .otp-pdot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,255,255,0.1);
          transition: background 0.3s, transform 0.2s;
        }
        .otp-pdot.filled { background: #007a33; transform: scale(1.3); }
      `}</style>

      <div className={`verify-card${mounted ? " mounted" : ""}${shake ? " shake" : ""}`}>
        <div className="verify-stripe" />
        <div className="verify-inner">

          {/* Header */}
          <div className="verify-header">
            <div className={`verify-icon${success ? " success-icon" : ""}`}>
              {success ? "✓" : "✉"}
            </div>
            <h1 className="verify-title">
              {success ? "Account verified!" : "Check your email"}
            </h1>
            <p className="verify-sub">
              {success
                ? "You're all set. Taking you to login…"
                : "We sent a 6-digit code to"}
            </p>
            {!success && <span className="verify-email-chip">{email}</span>}
          </div>

          {!success && (
            <>
              {/* Timer */}
              <div className={`timer-row${expired ? "" : timerDanger ? " danger" : " normal"}`}>
                <div className={`timer-dot${expired ? " expired" : timerDanger ? " danger" : ""}`} />
                {expired ? "Code expired" : `Expires in ${timer}`}
              </div>

              {/* Error */}
              {error && (
                <div className="error-banner">
                  <span>⚠</span><span>{error}</span>
                </div>
              )}

              {/* OTP progress dots */}
              <div className="otp-progress">
                {digits.map((d, i) => (
                  <div key={i} className={`otp-pdot${d ? " filled" : ""}`} />
                ))}
              </div>

              {/* OTP input boxes */}
              <form onSubmit={handleVerify} noValidate>
                <div className="otp-row" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleDigit(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className={`otp-box${d ? " filled" : ""}${error ? " error-box" : ""}`}
                      aria-label={`Digit ${i + 1}`}
                      autoComplete="one-time-code"
                      disabled={expired || loading}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className={`submit-btn${success ? " success-state" : ""}`}
                  disabled={!otpComplete || loading || expired}
                >
                  {loading ? "Verifying…" : otpComplete ? "Verify account →" : `Enter ${OTP_LENGTH - otp.length} more digit${OTP_LENGTH - otp.length !== 1 ? "s" : ""}`}
                </button>
              </form>

              {/* Resend */}
              <div className="resend-section">
                <p className="resend-label">Didn't receive the code?</p>
                <button
                  className="resend-btn"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resendLoading}
                >
                  {resendLoading ? "Sending…" : "Resend code"}
                </button>
                {resendCooldown > 0 && (
                  <p className="cooldown-text">Resend available in {resendCooldown}s</p>
                )}
              </div>
            </>
          )}

          {/* Back to login */}
          <div className="back-row">
            <button className="back-btn" onClick={() => navigate("/login")}>
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}