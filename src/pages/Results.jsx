import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

// Map party abbreviations to colors
const partyColors = {
  DP: "#007bff",   // Democratic Party - Blue
  NUF: "#28a745",  // National Unity Front - Green
  IP: "#ffc107",   // Independent Party - Yellow
};

export default function Results() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await API.get("/votes/results/1/"); // election ID
        setResults(res.data);
      } catch (err) {
        console.error("Failed to fetch results:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) return <p>Loading results...</p>;
  if (!results) return <p>No results available.</p>;

  return (
    <div style={{ maxWidth: "900px", margin: "auto", padding: "20px" }}>
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          marginBottom: "20px",
          padding: "8px 14px",
          borderRadius: "6px",
          border: "none",
          background: "#6c757d",
          color: "white",
          cursor: "pointer",
        }}
      >
        ← Back to Dashboard
      </button>

      <h1 style={{ textAlign: "center" }}>📊 {results.election_title} Results</h1>

      {results.positions.map((position) => {
        const totalVotes = position.candidates.reduce(
          (sum, c) => sum + c.votes,
          0
        );

        return (
          <div key={position.position_id} style={{ marginBottom: "40px" }}>
            <h2>{position.position_title}</h2>

            {position.candidates.map((candidate) => {
              const percentage = totalVotes
                ? ((candidate.votes / totalVotes) * 100).toFixed(1)
                : 0;
              const barColor = partyColors[candidate.party] || "#007bff";

              return (
                <div
                  key={candidate.candidate_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "15px",
                    border: "1px solid #ddd",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "#fff",
                  }}
                >
                  <img
                    src={candidate.image_url}
                    alt={candidate.name}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginRight: "15px",
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {/* Party badge */}
                        <img
                          src={`/party_badges/${candidate.party}.png`} // adjust path accordingly
                          alt={candidate.party}
                          style={{ width: "20px", height: "20px" }}
                        />
                        {candidate.name} ({candidate.party})
                      </span>
                      <span>{candidate.votes} votes</span>
                    </div>

                    <div
                      style={{
                        height: "12px",
                        width: "100%",
                        background: "#eee",
                        borderRadius: "6px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          background: barColor,
                          height: "100%",
                        }}
                      ></div>
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#555",
                        marginTop: "4px",
                      }}
                    >
                      {percentage}% of total votes
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}