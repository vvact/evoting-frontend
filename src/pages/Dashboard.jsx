import React, { useEffect, useState } from "react";
import API from "../api";
import Navbar from "../components/Navbar";

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

  // Confirm vote
  const confirmVote = async () => {
    if (!selectedCandidate || !selectedPosition) return;

    try {
      setVoting(true);

      await API.post(
        `/votes/cast/${selectedPosition.id}/${selectedCandidate.id}/`
      );

      alert(`Vote recorded for ${selectedCandidate.name}`);

      setShowModal(false);

      const res = await API.get("/elections/");
      setElections(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Voting failed");
    } finally {
      setVoting(false);
    }
  };

  if (!user) return <p>Please login.</p>;
  if (loading) return <p>Loading elections...</p>;

  return (
    <>
      {/* NAVBAR */}
      <Navbar user={user} />

      {/* DASHBOARD CONTAINER */}
      <div style={{ maxWidth: "1000px", margin: "40px auto", padding: "20px" }}>
        <h1 style={{ textAlign: "center" }}>🗳 Election Ballot</h1>

        {elections.map((election) => (
          <div key={election.id} style={{ marginBottom: "40px" }}>
            <h2>{election.title}</h2>
            <p>{election.description}</p>

            {election.positions.map((position) => (
              <div key={position.id} style={{ marginTop: "25px" }}>
                <h3>
                  {position.title}{" "}
                  {position.has_voted && (
                    <span style={{ color: "green", fontSize: "14px" }}>
                      ✓ You voted
                    </span>
                  )}
                </h3>

                {/* CANDIDATE GRID */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "20px",
                    marginTop: "15px",
                  }}
                >
                  {position.candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: "10px",
                        padding: "15px",
                        textAlign: "center",
                        background: "#fff",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                      }}
                    >
                      <img
                        src={candidate.image_url}
                        alt={candidate.name}
                        style={{
                          width: "90px",
                          height: "90px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          marginBottom: "10px",
                        }}
                      />

                      <h4 style={{ marginBottom: "6px" }}>{candidate.name}</h4>

                      {/* PARTY */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontSize: "14px",
                          color: "#555",
                          marginBottom: "12px",
                        }}
                      >
                        <img
                          src={candidate.party.badge_url}
                          alt={candidate.party.name}
                          style={{
                            width: "20px",
                            height: "20px",
                            marginRight: "6px",
                          }}
                        />
                        {candidate.party.name} (
                        {candidate.party.abbreviation})
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          setSelectedPosition(position);
                          setShowModal(true);
                        }}
                        disabled={!position.can_vote || voting}
                        style={{
                          background: position.can_vote
                            ? "#007bff"
                            : "#6c757d",
                          color: "white",
                          border: "none",
                          padding: "8px 14px",
                          borderRadius: "6px",
                          cursor: position.can_vote
                            ? "pointer"
                            : "not-allowed",
                          width: "100%",
                        }}
                      >
                        {position.can_vote ? "Vote" : "Vote Cast"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* CONFIRMATION MODAL */}
        {showModal && selectedCandidate && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                padding: "25px",
                borderRadius: "10px",
                width: "350px",
                textAlign: "center",
              }}
            >
              <h3>Confirm Your Vote</h3>

              <img
                src={selectedCandidate.image_url}
                alt={selectedCandidate.name}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  margin: "10px 0",
                }}
              />

              <h4>{selectedCandidate.name}</h4>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <img
                  src={selectedCandidate.party.badge_url}
                  alt={selectedCandidate.party.name}
                  style={{ width: "20px", marginRight: "6px" }}
                />
                {selectedCandidate.party.name} (
                {selectedCandidate.party.abbreviation})
              </div>

              <p style={{ fontSize: "14px", color: "#555" }}>
                You are voting for <strong>{selectedCandidate.name}</strong> for{" "}
                <strong>{selectedPosition.title}</strong>.
              </p>

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    background: "#f1f1f1",
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={confirmVote}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "5px",
                    border: "none",
                    background: "#28a745",
                    color: "white",
                  }}
                >
                  Confirm Vote
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}