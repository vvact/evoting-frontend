import { useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../api"; // ✅ Global loader-enabled API hook

export default function Landing() {
  const { call } = useApi(); // Use global loader
  const [activeElection, setActiveElection] = useState(null);

  const fetchElection = async () => {
    try {
      const res = await call({
        url: "/elections/active/", // Example endpoint
        method: "GET",
      });
      setActiveElection(res);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-6 sm:p-8 md:p-10 relative overflow-hidden">

        {/* Decorative flag stripes */}
        <div className="absolute top-0 left-0 w-full h-1 flex">
          <div className="w-1/3 h-full bg-green-600"></div>
          <div className="w-1/3 h-full bg-black"></div>
          <div className="w-1/3 h-full bg-red-600"></div>
        </div>

        {/* Header / Branding */}
        <div className="text-center mb-8 mt-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2">
            <span className="bg-gradient-to-r from-green-600 via-black to-red-600 bg-clip-text text-transparent bg-[length:200%_auto] hover:bg-right transition-all duration-500">
              Secure E-Voting Platform
            </span>
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Powered by the Independent Election Authority
          </p>
        </div>

        {/* Main Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <Link
            to="/login"
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 active:scale-95 transition-all text-center shadow-md"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-white text-black border-2 border-black hover:bg-black hover:text-white active:scale-95 transition-all text-center px-8 py-3 rounded-lg font-semibold shadow-sm"
          >
            Verify Identity
          </Link>
        </div>

        {/* Demo: Fetch Active Election */}
        <div className="text-center mb-6">
          <button
            onClick={fetchElection}
            className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 shadow-md transition-all"
          >
            Fetch Active Election
          </button>
        </div>

        {/* Display fetched data */}
        {activeElection && (
          <div className="bg-gray-100 rounded-xl p-5 shadow-inner border-l-4 border-red-600 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              🗳 {activeElection.title}
            </h2>
            <p className="text-gray-600">
              Voting Period: {activeElection.start_date} – {activeElection.end_date}
            </p>
            <p className="text-gray-600">Candidates: {activeElection.candidates_count}</p>
          </div>
        )}

        {/* Voting Guidelines */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 border-t-4 border-t-green-600">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Voting Guidelines</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1 marker:text-green-600">
            <li>Each registered voter can vote only once per election.</li>
            <li>Identity verification is required before voting.</li>
            <li>Votes are securely recorded and cannot be modified.</li>
            <li>All results are transparently counted.</li>
          </ul>
        </div>

        {/* Security Badges */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs sm:text-sm text-gray-600 mt-6">
          <div className="flex items-center gap-1 bg-green-50 text-green-800 px-3 py-1 rounded-full shadow-sm border border-green-200">🛡 Encrypted Voting</div>
          <div className="flex items-center gap-1 bg-black text-white px-3 py-1 rounded-full shadow-sm">🔒 Secure Authentication</div>
          <div className="flex items-center gap-1 bg-red-50 text-red-800 px-3 py-1 rounded-full shadow-sm border border-red-200">✔ Verified Voters Only</div>
          <div className="flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full shadow-sm">⚖ Transparent Process</div>
        </div>

        {/* Footer with flag colors */}
        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Election Authority</p>
          <div className="flex gap-1">
            <span className="w-3 h-3 bg-green-600 rounded-full"></span>
            <span className="w-3 h-3 bg-black rounded-full"></span>
            <span className="w-3 h-3 bg-red-600 rounded-full"></span>
          </div>
        </div>

      </div>
    </div>
  );
}