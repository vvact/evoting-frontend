import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api";
import { useLoader } from "../contexts/LoaderContext"; // ✅ Import the loader

export default function Register({ setVerifyEmail }) {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader(); // ✅ Access global loader

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
  const [successMessage, setSuccessMessage] = useState("");

  const validateField = (name, value) => {
    let error = "";

    if (["first_name", "middle_name", "last_name"].includes(name)) {
      if (value.length < 2) error = `${name.replace("_", " ")} must have at least 2 letters.`;
    }

    if (name === "id_number") {
      if (value.length < 7) error = "ID Number must be at least 7 digits.";
    }

    if (name === "password") {
      if (value.length > 0 && value.length < 4) error = "Password must be at least 4 characters.";
    }

    if (name === "confirm_password") {
      if (value !== formData.password) error = "Passwords do not match.";
    }

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) error = "Invalid email format.";
    }

    return error ? [error] : undefined;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "id_number") {
      newValue = value.replace(/\D/g, "").slice(0, 8);
    }

    setFormData({ ...formData, [name]: newValue });
    setErrors({ ...errors, [name]: validateField(name, newValue) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    const newErrors = {};
    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    showLoader(); // ✅ Show global loader
    try {
      await registerUser(formData);
      setVerifyEmail(formData.email);
      setSuccessMessage("🎉 Account created successfully! Verify email or login directly.");
      setTimeout(() => setSuccessMessage(""), 5000);
      setTimeout(() => navigate("/verify"), 2000);
    } catch (err) {
      if (err.response?.data) setErrors(err.response.data);
      else setErrors({ non_field_errors: ["Registration failed."] });
    } finally {
      hideLoader(); // ✅ Hide global loader
    }
  };

  const totalFields = Object.keys(formData).length;
  const validFields = Object.keys(formData).filter((field) => !validateField(field, formData[field])).length;
  const progressPercent = Math.round((validFields / totalFields) * 100);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Form */}
          <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex flex-col gap-2 mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl" role="img" aria-label="Kenyan flag">🇰🇪</span>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create Account</h2>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    progressPercent === 100 ? "bg-green-500" : "bg-blue-400"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">{progressPercent}% complete</p>
            </div>

            {errors.non_field_errors && (
              <div className="mb-3 p-2 sm:p-3 bg-red-50 border-l-4 border-red-600 rounded-r-md">
                <p className="text-red-700 text-sm">{errors.non_field_errors.join(" ")}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                ["first_name", "First Name"],
                ["middle_name", "Middle Name"],
                ["last_name", "Last Name"],
                ["email", "Email", "email"],
                ["id_number", "ID Number"],
                ["password", "Password", "password"],
                ["confirm_password", "Confirm Password", "password"],
              ].map(([name, label, type = "text"]) => (
                <div key={name} className="flex flex-col">
                  <label htmlFor={name} className="sr-only">{label}</label>
                  <input
                    id={name}
                    type={type}
                    name={name}
                    placeholder={label}
                    value={formData[name]}
                    onChange={handleChange}
                    required
                    className={`w-full px-2 sm:px-3 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-red-500 transition duration-200 bg-white/70 placeholder-gray-400 text-gray-900 ${
                      errors[name] ? "border-red-600" : "border-gray-300"
                    }`}
                  />
                  {errors[name] && (
                    <p className="text-red-600 text-xs sm:text-sm mt-1">{errors[name].join(" ")}</p>
                  )}
                </div>
              ))}

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2 sm:py-3 px-3 sm:px-4 rounded-lg text-white font-semibold text-base sm:text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                  style={{
                    background: "linear-gradient(90deg, #000000, #d21034, #007a33)",
                    backgroundSize: "200% auto",
                    transition: "background-position 0.3s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundPosition = "right center")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundPosition = "left center")}
                >
                  Register
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Success/Login */}
          <div className="relative p-4 sm:p-6 lg:p-8 bg-gray-50 flex flex-col items-center justify-center text-center border-t md:border-t-0 md:border-l border-gray-200">
            {successMessage && (
              <div className="absolute top-0 left-0 right-0 m-4 p-3 sm:p-4 bg-black text-white rounded-xl shadow-2xl animate-fade-in-down z-10">
                <p className="text-sm sm:text-base font-medium">{successMessage}</p>
                <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                  <button
                    onClick={() => navigate("/login")}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs sm:text-sm font-semibold transition"
                  >
                    Go to Login
                  </button>
                  <button
                    onClick={() => navigate("/verify")}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs sm:text-sm font-semibold transition"
                  >
                    Verify Email
                  </button>
                </div>
              </div>
            )}

            <div className="max-w-xs">
              <div className="mb-4 flex justify-center gap-1">
                <span className="w-6 h-1 sm:w-8 sm:h-2 bg-black rounded-full"></span>
                <span className="w-6 h-1 sm:w-8 sm:h-2 bg-red-600 rounded-full"></span>
                <span className="w-6 h-1 sm:w-8 sm:h-2 bg-green-600 rounded-full"></span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Welcome Back!</h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-6">
                Already have an account? Sign in to access your account.
              </p>
              <Link
                to="/login"
                className="inline-block w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition transform hover:scale-105 text-sm sm:text-base"
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