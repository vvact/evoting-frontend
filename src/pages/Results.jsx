import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

// Map party abbreviations to colors (for progress bars)
const partyColors = {
  DP: "#007bff",   // Democratic Party - Blue
  NUF: "#28a745",  // National Unity Front - Green
  IP: "#ffc107",   // Independent Party - Yellow
};

export default function Results() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await API.get("/votes/results/1/"); // election ID (could be dynamic)
        setResults(res.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setError("Unable to load results. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const handleBack = () => {
    navigate("/dashboard");
  };

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-6 bg-gray-200 rounded w-64 mb-4"></div>
                  <div className="space-y-4">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">📢</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600">No results available at this time.</p>
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition mb-4 sm:mb-0 order-2 sm:order-1"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 order-1 sm:order-2">
            📊 {results.election_title} Results
          </h1>
        </div>

        {/* Results by position */}
        <div className="space-y-8">
          {results.positions.map((position) => {
            const totalVotes = position.candidates.reduce(
              (sum, c) => sum + c.votes,
              0
            );

            return (
              <section
                key={position.position_id}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
              >
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {position.position_title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Total votes: {totalVotes.toLocaleString()}
                  </p>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                  {position.candidates.map((candidate) => {
                    const percentage = totalVotes
                      ? ((candidate.votes / totalVotes) * 100).toFixed(1)
                      : 0;
                    const barColor = partyColors[candidate.party] || "#007bff";

                    return (
                      <div
                        key={candidate.candidate_id}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        {/* Candidate image and info */}
                        <div className="flex items-center gap-4 flex-1">
                          <img
                            src={candidate.image_url}
                            alt={candidate.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/56?text=?"; // fallback
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900 truncate">
                                {candidate.name}
                              </span>
                              {/* Party badge with fallback */}
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                                {candidate.party}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <span>{candidate.votes.toLocaleString()} votes</span>
                              <span>•</span>
                              <span>{percentage}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Progress bar (visible on larger screens, stacked on mobile) */}
                        <div className="w-full sm:w-64">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%`, backgroundColor: barColor }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700 w-12 text-right">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}