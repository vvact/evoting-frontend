import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api";
import { useLoader } from "../contexts/LoaderContext"; // ✅ Import global loader

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader(); // ✅ Access loader

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    showLoader(); // ✅ Show global loader
    try {
      const res = await loginUser({ email, password });
      const { access, refresh, user } = res;

      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      localStorage.setItem("user", JSON.stringify(user));

      onLogin(user, { access, refresh });

      setSuccess("Login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors.join(" "));
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } finally {
      hideLoader(); // ✅ Hide global loader
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 px-4 py-4">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Accent bar */}
          <div className="h-1 bg-gradient-to-r from-black via-red-600 to-green-600"></div>

          <div className="p-5 sm:p-6">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full mb-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M6 14h12m-6-6v12m-4 0h8" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-sm text-gray-500 mt-1">Sign in to your voting account</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-3 p-2 bg-red-50 border-l-4 border-red-500 rounded-r-md animate-shake">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mb-3 p-2 bg-green-50 border-l-4 border-green-500 rounded-r-md">
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}

            {/* Form */}
            <form className="space-y-3" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 transition bg-gray-50/50 hover:bg-white"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 transition bg-gray-50/50 hover:bg-white"
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 font-semibold rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200"
              >
                Login
              </button>
            </form>

            {/* Footer */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-red-600 hover:text-red-800 font-medium hover:underline"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}