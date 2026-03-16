import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api";

export default function Register({ setVerifyEmail }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    id_number: "",
    password: "",
    confirm_password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");
    setLoading(true);

    try {
      await registerUser(formData);
      setVerifyEmail(formData.email);

      setSuccessMessage(
        "🎉 Account created successfully! Verify email or login directly."
      );

      setTimeout(() => setSuccessMessage(""), 5000);
      setTimeout(() => navigate("/verify"), 2000);
    } catch (err) {
      if (err.response?.data) setErrors(err.response.data);
      else setErrors({ non_field_errors: ["Registration failed."] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Registration Form */}
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-3xl" role="img" aria-label="Kenyan flag">
                🇰🇪
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Create Account
              </h2>
            </div>

            {errors.non_field_errors && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 rounded-r-md">
                <p className="text-red-700 text-sm">
                  {errors.non_field_errors.join(" ")}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                ["first_name", "First Name"],
                ["middle_name", "Middle Name"],
                ["last_name", "Last Name"],
                ["email", "Email", "email"],
                ["id_number", "ID Number"],
                ["password", "Password", "password"],
                ["confirm_password", "Confirm Password", "password"],
              ].map(([name, label, type = "text"]) => (
                <div key={name}>
                  <label htmlFor={name} className="sr-only">
                    {label}
                  </label>
                  <input
                    id={name}
                    type={type}
                    name={name}
                    placeholder={label}
                    value={formData[name]}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 bg-white/70 placeholder-gray-400 text-gray-900"
                  />
                  {errors[name] && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors[name].join(" ")}
                    </p>
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg text-white font-semibold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                style={{
                  background: "linear-gradient(90deg, #000000, #d21034, #007a33)",
                  backgroundSize: "200% auto",
                  transition: "background-position 0.3s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundPosition = "right center")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundPosition = "left center")
                }
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>
          </div>

          {/* Right Column: Success / Login */}
          <div className="relative p-6 sm:p-8 lg:p-10 bg-gray-50 flex flex-col items-center justify-center text-center border-t md:border-t-0 md:border-l border-gray-200">
            {successMessage && (
              <div className="absolute top-0 left-0 right-0 m-4 p-4 bg-black text-white rounded-xl shadow-2xl animate-fade-in-down z-10">
                <p className="text-sm sm:text-base font-medium">{successMessage}</p>
                <div className="mt-3 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate("/login")}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition"
                  >
                    Go to Login
                  </button>
                  <button
                    onClick={() => navigate("/verify")}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition"
                  >
                    Verify Email
                  </button>
                </div>
              </div>
            )}

            <div className="max-w-xs">
              <div className="mb-6 flex justify-center gap-1">
                <span className="w-8 h-2 bg-black rounded-full"></span>
                <span className="w-8 h-2 bg-red-600 rounded-full"></span>
                <span className="w-8 h-2 bg-green-600 rounded-full"></span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Welcome Back!
              </h3>
              <p className="text-gray-600 text-sm sm:text-base mb-6">
                Already have an account? Sign in to access your profile and
                manage your bookings.
              </p>
              <Link
                to="/login"
                className="inline-block w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition transform hover:scale-105"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}