import React, { useEffect, useState } from "react";
import API from "../api";
import Navbar from "../components/Navbar";

// Position color mapping
const POSITION_COLORS = {
  Governor: "bg-blue-50 border-blue-300 text-blue-900",
  Senator: "bg-purple-50 border-purple-300 text-purple-900",
  "Members of the County Assembly": "bg-green-50 border-green-300 text-green-900",
};

export default function Dashboard({ user: propUser }) {
  const [user] = useState(() =>
    propUser || JSON.parse(localStorage.getItem("user"))
  );
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await API.get("/elections/");
        setElections(res.data);
      } catch (err) {
        console.error("Failed to fetch elections:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchElections();
  }, []);

  const confirmVote = async () => {
    if (!selectedCandidate || !selectedPosition) return;

    try {
      setVoting(true);
      await API.post(
        `/votes/cast/${selectedPosition.id}/${selectedCandidate.id}/`
      );
      alert(`Vote recorded for ${selectedCandidate.name}`);
      setShowModal(false);

      // Refresh elections to update voting status
      const res = await API.get("/elections/");
      setElections(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Voting failed");
    } finally {
      setVoting(false);
    }
  };

  if (!user) return <p className="text-center mt-10">Please login.</p>;

  if (loading) {
    return (
      <div>
        <Navbar user={user} />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                  <div className="h-24 bg-gray-200 rounded-full w-24 mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar user={user} />

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          🗳 Election Ballot
        </h1>

        <div className="space-y-10">
          {elections.map((election) => (
            <section
              key={election.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
            >
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800">
                  {election.title}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{election.description}</p>
              </div>

              <div className="p-6 space-y-8">
                {election.positions.map((position) => {
                  const colorClasses = POSITION_COLORS[position.title] || "bg-gray-50 border-gray-300 text-gray-900";

                  return (
                    <div key={position.id}>
                      {/* Position Header with color accent */}
                      <div
                        className={`flex items-center justify-between mb-4 border-b-2 px-3 py-1 rounded ${colorClasses}`}
                      >
                        <h3 className="text-lg font-semibold">{position.title}</h3>
                        {position.has_voted && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ You voted
                          </span>
                        )}
                      </div>

                      {/* Candidate grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {position.candidates.map((candidate) => (
                          <div
                            key={candidate.id}
                            className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow"
                          >
                            <img
                              src={candidate.image_url}
                              alt={candidate.name}
                              className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-gray-100"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/96?text=?";
                              }}
                            />

                            <h4 className="font-semibold text-gray-900 mt-4">
                              {candidate.name}
                            </h4>

                            <div className="flex items-center justify-center gap-1 mt-2 text-sm text-gray-600">
                              {candidate.party?.badge_url && (
                                <img
                                  src={candidate.party.badge_url}
                                  alt={candidate.party.name}
                                  className="w-5 h-5 object-contain"
                                />
                              )}
                              <span>
                                {candidate.party?.name} ({candidate.party?.abbreviation})
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setSelectedPosition(position);
                                setShowModal(true);
                              }}
                              disabled={!position.can_vote || voting}
                              className={`mt-4 w-full py-2 px-4 rounded-lg font-medium transition ${
                                position.can_vote
                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
                              }`}
                            >
                              {position.can_vote ? "Vote" : "Vote Cast"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && selectedCandidate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-center mb-4">Confirm Your Vote</h3>

            <div className="text-center">
              <img
                src={selectedCandidate.image_url}
                alt={selectedCandidate.name}
                className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-gray-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/96?text=?";
                }}
              />

              <h4 className="font-semibold text-lg mt-2">{selectedCandidate.name}</h4>

              <div className="flex items-center justify-center gap-2 mt-1 text-gray-600">
                {selectedCandidate.party?.badge_url && (
                  <img
                    src={selectedCandidate.party.badge_url}
                    alt={selectedCandidate.party.name}
                    className="w-5 h-5 object-contain"
                  />
                )}
                <span>
                  {selectedCandidate.party?.name} ({selectedCandidate.party?.abbreviation})
                </span>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                You are voting for <span className="font-medium">{selectedCandidate.name}</span>{" "}
                for <span className="font-medium">{selectedPosition.title}</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmVote}
                  disabled={voting}
                  className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {voting ? "Confirming..." : "Confirm Vote"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}