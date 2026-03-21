import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api";
import { useLoader } from "../contexts/LoaderContext"; // ✅ Global loader

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    showLoader(); // Show global loader
    try {
      const res = await loginUser({ email, password });
      const { access, refresh, user } = res;

      // Save tokens & user
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      localStorage.setItem("user", JSON.stringify(user));

      onLogin(user, { access, refresh });

      setSuccess("Login successful! Redirecting...");

      // Wait a short moment before navigating
      setTimeout(() => {
        hideLoader(); // Hide loader before navigation
        navigate("/dashboard");
      }, 500);
    } catch (err) {
      if (err.response?.data?.detail) setError(err.response.data.detail);
      else if (err.response?.data?.non_field_errors) setError(err.response.data.non_field_errors.join(" "));
      else setError("Login failed. Please check your credentials.");
      hideLoader(); // Hide loader on error
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 px-4 py-4">
      {/* Decorative background omitted for brevity */}
      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-black via-red-600 to-green-600"></div>

        <div className="p-5 sm:p-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your voting account</p>
          </div>

          {error && <div className="mb-3 p-2 bg-red-50 border-l-4 border-red-500 rounded-r-md"><p className="text-red-700 text-sm">{error}</p></div>}
          {success && <div className="mb-3 p-2 bg-green-50 border-l-4 border-green-500 rounded-r-md"><p className="text-green-700 text-sm">{success}</p></div>}

          <form className="space-y-3" onSubmit={handleSubmit}>
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

            <button
              type="submit"
              disabled={!!success} // disable after success to prevent double submission
              className="w-full py-2.5 px-4 font-semibold rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200"
            >
              {success ? "Redirecting..." : "Login"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Don't have an account?{" "}
              <Link to="/register" className="text-red-600 hover:text-red-800 font-medium hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}