import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PublicAPI } from "../api"; // ✅ Use PublicAPI for OTP endpoints

export default function Verify({ email, setVerifyEmail }) {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState(() => {
    const saved = localStorage.getItem("otpExpiresAt");
    return saved ? new Date(saved) : new Date(Date.now() + 12 * 60 * 60 * 1000);
  });
  const [timer, setTimer] = useState("");

  // Redirect if email not available
  useEffect(() => {
    if (!email) navigate("/register");
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = expiresAt - now;
      if (diff <= 0) {
        setTimer("OTP expired");
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimer(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    localStorage.setItem("otpExpiresAt", expiresAt);
  }, [expiresAt]);

  // ------------------------------
  // Verify OTP
  // ------------------------------
  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await PublicAPI.post("verify-otp/", { email, otp }); // ✅ PublicAPI

      // Clear verifyEmail so user can't access /verify again
      setVerifyEmail("");
      localStorage.removeItem("verifyEmail");
      localStorage.removeItem("otpExpiresAt");

      alert("Account verified successfully! You can now log in.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid OTP, please try again");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // Resend OTP
  // ------------------------------
  const handleResend = async () => {
    setResendLoading(true);
    setError("");

    try {
      await PublicAPI.post("resend-otp/", { email }); // ✅ PublicAPI

      const newExpiry = new Date(Date.now() + 12 * 60 * 60 * 1000);
      setExpiresAt(newExpiry);

      alert("A new OTP has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Verify Your Account</h2>
        <p className="text-gray-600 mb-2 text-center">
          Enter the OTP sent to your email to verify your account.
        </p>
        <p className="text-sm text-gray-500 mb-6 text-center">OTP expires in: {timer}</p>

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            disabled
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
          />
          <input
            type="text"
            placeholder="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {loading ? "Verifying..." : "Verify Account"}
          </button>
        </form>

        <button
          onClick={handleResend}
          disabled={resendLoading}
          className="w-full mt-4 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition"
        >
          {resendLoading ? "Resending..." : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}
