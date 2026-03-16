import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PublicAPI } from "../api";

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
        setTimer("Expired");
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

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await PublicAPI.post("verify-otp/", { email, otp });

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

  const handleResend = async () => {
    setResendLoading(true);
    setError("");

    try {
      await PublicAPI.post("resend-otp/", { email });

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify your account</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            We've sent a verification code to your email
          </p>
        </div>

        {/* Timer badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Code expires in: {timer}
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
              Verification code
            </label>
            <input
              id="otp"
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? "Verifying..." : "Verify account"}
          </button>
        </form>

        {/* Resend section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading ? "Resending..." : "Click to resend"}
          </button>
        </div>

        {/* Back to login */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-gray-500 hover:text-gray-700 transition duration-200"
          >
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );
}