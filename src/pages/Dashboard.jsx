import React, { useEffect, useState } from "react";
import API from "../api";
import Navbar from "../components/Navbar";

const POSITION_ACCENTS = {
  Governor: { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", label: "GOV" },
  Senator:  { color: "#a855f7", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.25)", label: "SEN" },
  "Members of the County Assembly": { color: "#007a33", bg: "rgba(0,122,51,0.08)", border: "rgba(0,122,51,0.25)", label: "MCA" },
};

const DEFAULT_ACCENT = { color: "#888", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.12)", label: "POS" };

function CandidateImage({ src, alt, size = 80 }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", position: "relative", flexShrink: 0 }}>
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)", animation: "shimmer 1.5s infinite"
        }} />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=1a1a1a&color=888&size=128`; }}
        style={{
          width: size, height: size, borderRadius: "50%", objectFit: "cover",
          border: "2px solid rgba(255,255,255,0.1)",
          opacity: loaded ? 1 : 0, transition: "opacity 0.4s ease"
        }}
      />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, padding: "1.5rem", display: "flex", flexDirection: "column",
      alignItems: "center", gap: 12
    }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.07)", animation: "shimmer 1.5s infinite" }} />
      <div style={{ width: "60%", height: 14, borderRadius: 8, background: "rgba(255,255,255,0.07)", animation: "shimmer 1.5s infinite" }} />
      <div style={{ width: "40%", height: 11, borderRadius: 8, background: "rgba(255,255,255,0.05)", animation: "shimmer 1.5s infinite" }} />
      <div style={{ width: "100%", height: 38, borderRadius: 10, background: "rgba(255,255,255,0.06)", animation: "shimmer 1.5s infinite", marginTop: 4 }} />
    </div>
  );
}

export default function Dashboard({ user: propUser }) {
  const [user] = useState(() => propUser || JSON.parse(localStorage.getItem("user")));
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [voteSuccess, setVoteSuccess] = useState(null);
  const [voteError, setVoteError] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchElections();
  }, []);

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

  const openModal = (candidate, position) => {
    setSelectedCandidate(candidate);
    setSelectedPosition(position);
    setVoteError("");
    setShowModal(true);
  };

  const confirmVote = async () => {
    if (!selectedCandidate || !selectedPosition) return;
    setVoting(true);
    setVoteError("");
    try {
      await API.post(`/votes/cast/${selectedPosition.id}/${selectedCandidate.id}/`);
      setVoteSuccess(selectedCandidate.name);
      setTimeout(async () => {
        setShowModal(false);
        setVoteSuccess(null);
        const res = await API.get("/elections/");
        setElections(res.data);
      }, 1800);
    } catch (err) {
      setVoteError(err.response?.data?.error || "Voting failed. Please try again.");
    } finally {
      setVoting(false);
    }
  };

  const totalPositions = elections.flatMap((e) => e.positions).length;
  const votedPositions = elections.flatMap((e) => e.positions).filter((p) => p.has_voted).length;
  const progressPct = totalPositions > 0 ? Math.round((votedPositions / totalPositions) * 100) : 0;

  if (!user) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontFamily: "DM Sans, sans-serif" }}>
      Please log in to access the dashboard.
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }

        .dash-root {
          min-height: 100vh;
          background: #0a0a0a;
          background-image:
            radial-gradient(ellipse at 10% 20%, rgba(0,122,51,0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 90% 80%, rgba(210,16,52,0.04) 0%, transparent 50%);
          font-family: 'DM Sans', sans-serif;
          padding-bottom: 4rem;
        }

        .dash-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2rem 1.25rem;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.45s ease, transform 0.45s ease;
        }
        .dash-inner.mounted { opacity: 1; transform: translateY(0); }

        /* ── Page header ── */
        .dash-header {
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .dash-title-row {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
        }
        .dash-title {
          font-family: 'Sora', sans-serif;
          font-size: 26px; font-weight: 700; color: #fff; letter-spacing: -0.4px;
        }
        .dash-subtitle { font-size: 13px; color: rgba(255,255,255,0.35); margin-top: 3px; }

        /* ── Ballot progress bar ── */
        .ballot-progress {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 1rem 1.25rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .bp-labels { flex: 1; }
        .bp-title { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 6px; }
        .bp-track { height: 6px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; }
        .bp-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #d21034, #007a33); transition: width 0.6s ease; }
        .bp-count { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; color: #fff; white-space: nowrap; }
        .bp-count span { font-size: 13px; color: rgba(255,255,255,0.3); font-weight: 400; }

        /* ── Election section ── */
        .election-section {
          margin-bottom: 2rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          overflow: hidden;
        }
        .election-head {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
        }
        .election-title {
          font-family: 'Sora', sans-serif;
          font-size: 16px; font-weight: 700; color: #fff;
        }
        .election-desc { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 3px; }

        /* ── Position group ── */
        .position-group { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .position-group:last-child { border-bottom: none; }
        .position-label-row {
          display: flex; align-items: center; gap: 10px; margin-bottom: 1rem;
        }
        .position-badge {
          padding: 3px 10px; border-radius: 99px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          border: 1px solid;
        }
        .position-title {
          font-family: 'Sora', sans-serif;
          font-size: 15px; font-weight: 600; color: #fff;
        }
        .voted-chip {
          display: inline-flex; align-items: center; gap: 4px;
          margin-left: auto;
          padding: 3px 10px; border-radius: 99px;
          background: rgba(0,122,51,0.15); border: 1px solid rgba(0,180,80,0.3);
          font-size: 11px; font-weight: 600; color: #4ade80;
        }

        /* ── Candidate grid ── */
        .candidates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }

        /* ── Candidate card ── */
        .candidate-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.25rem 1rem;
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 10px;
          transition: border-color 0.25s, background 0.25s, transform 0.2s;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .candidate-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .candidate-card.hoverable:hover {
          transform: translateY(-3px);
        }
        .candidate-card.hoverable:hover::before { opacity: 1; }

        .candidate-name {
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 600; color: #fff; line-height: 1.3;
        }
        .candidate-party {
          display: flex; align-items: center; justify-content: center; gap: 5px;
          font-size: 12px; color: rgba(255,255,255,0.4);
        }
        .candidate-party img { width: 16px; height: 16px; object-fit: contain; }

        .vote-btn {
          width: 100%; padding: 9px 12px; border: none; border-radius: 10px;
          font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: transform 0.15s, opacity 0.2s, background 0.2s;
          margin-top: 2px;
        }
        .vote-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .vote-btn:active:not(:disabled) { transform: scale(0.97); }
        .vote-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .vote-btn.can-vote { color: #fff; }
        .vote-btn.voted { background: rgba(0,122,51,0.12); border: 1px solid rgba(0,180,80,0.25); color: #4ade80; font-size: 12px; }

        /* ── Modal ── */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.75);
          display: flex; align-items: center; justify-content: center;
          z-index: 50; padding: 1rem;
          animation: fadeIn 0.25s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal-card {
          background: #151515;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          max-width: 400px; width: 100%;
          overflow: hidden;
          animation: popIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275);
        }
        @keyframes popIn { from { opacity:0; transform:scale(0.85) translateY(16px); } to { opacity:1; transform:none; } }
        .modal-stripe { height: 4px; background: linear-gradient(90deg,#000 0%,#d21034 50%,#007a33 100%); }
        .modal-inner { padding: 2rem; text-align: center; }
        .modal-title {
          font-family: 'Sora', sans-serif;
          font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 1.5rem;
        }
        .modal-candidate-row {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 1.25rem; margin-bottom: 1rem;
        }
        .modal-candidate-name { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 700; color: #fff; }
        .modal-candidate-party { font-size: 13px; color: rgba(255,255,255,0.4); }
        .modal-confirm-text { font-size: 13px; color: rgba(255,255,255,0.35); line-height: 1.6; margin-bottom: 1.5rem; }
        .modal-confirm-text strong { color: rgba(255,255,255,0.7); font-weight: 500; }

        .modal-error {
          display: flex; align-items: center; gap: 7px;
          background: rgba(210,16,52,0.1); border: 1px solid rgba(210,16,52,0.28);
          border-radius: 10px; padding: 9px 12px;
          font-size: 13px; color: #fc8181; margin-bottom: 1rem; text-align: left;
        }

        .modal-success {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 1rem 0;
        }
        .modal-success-icon {
          width: 56px; height: 56px; border-radius: 50%;
          background: rgba(0,122,51,0.15); border: 1px solid rgba(0,180,80,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px;
          animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
        }
        .modal-success-text { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 600; color: #4ade80; }

        .modal-actions { display: flex; gap: 10px; }
        .modal-cancel {
          flex: 1; padding: 11px; border-radius: 10px; cursor: pointer;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6); font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500; transition: background 0.2s;
        }
        .modal-cancel:hover { background: rgba(255,255,255,0.09); }
        .modal-confirm {
          flex: 1; padding: 11px; border-radius: 10px; cursor: pointer;
          border: none; color: #fff;
          font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600;
          background: linear-gradient(90deg, #007a33, #005a26);
          transition: opacity 0.2s, transform 0.15s;
        }
        .modal-confirm:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .modal-confirm:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Empty / loading states ── */
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* ── Warning banner (all voted) ── */
        .all-voted-banner {
          text-align: center; padding: 3rem 1rem; color: rgba(255,255,255,0.3);
        }
        .all-voted-icon { font-size: 40px; margin-bottom: 10px; }
        .all-voted-title { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 6px; }

        @media (max-width: 600px) {
          .candidates-grid { grid-template-columns: 1fr 1fr; }
          .dash-title { font-size: 20px; }
        }
        @media (max-width: 380px) {
          .candidates-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <Navbar user={user} />

      <div className="dash-root">
        <div className={`dash-inner${mounted ? " mounted" : ""}`}>

          {/* Page header */}
          <div className="dash-header">
            <div className="dash-title-row">
              <div>
                <div className="dash-title">🗳 Election Ballot</div>
                <div className="dash-subtitle">
                  {user?.first_name ? `Voting as ${user.first_name} ${user.last_name || ""}` : "Cast your votes below"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ width: 28, height: 6, borderRadius: 3, background: "#000", display: "block" }} />
                <span style={{ width: 28, height: 6, borderRadius: 3, background: "#d21034", display: "block" }} />
                <span style={{ width: 28, height: 6, borderRadius: 3, background: "#007a33", display: "block" }} />
              </div>
            </div>

            {!loading && totalPositions > 0 && (
              <div className="ballot-progress">
                <div className="bp-labels">
                  <div className="bp-title">Ballot progress</div>
                  <div className="bp-track">
                    <div className="bp-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
                <div className="bp-count">
                  {votedPositions}<span>/{totalPositions}</span>
                </div>
              </div>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[1, 2].map((s) => (
                <div key={s} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden" }}>
                  <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width: "35%", height: 16, borderRadius: 8, background: "rgba(255,255,255,0.07)", animation: "shimmer 1.5s infinite" }} />
                  </div>
                  <div style={{ padding: "1.25rem 1.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
                      {[1, 2, 3].map((c) => <SkeletonCard key={c} />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Elections */}
          {!loading && elections.map((election) => (
            <div key={election.id} className="election-section">
              <div className="election-head">
                <div>
                  <div className="election-title">{election.title}</div>
                  {election.description && <div className="election-desc">{election.description}</div>}
                </div>
              </div>

              {election.positions.map((position) => {
                const accent = POSITION_ACCENTS[position.title] || DEFAULT_ACCENT;
                return (
                  <div key={position.id} className="position-group">
                    <div className="position-label-row">
                      <div
                        className="position-badge"
                        style={{ background: accent.bg, borderColor: accent.border, color: accent.color }}
                      >
                        {accent.label}
                      </div>
                      <div className="position-title">{position.title}</div>
                      {position.has_voted && (
                        <div className="voted-chip">
                          <span>✓</span> Voted
                        </div>
                      )}
                    </div>

                    <div className="candidates-grid">
                      {position.candidates.map((candidate) => (
                        <div
                          key={candidate.id}
                          className={`candidate-card${position.can_vote ? " hoverable" : ""}`}
                          style={{
                            borderColor: hoveredCard === candidate.id && position.can_vote
                              ? accent.border : undefined,
                            background: hoveredCard === candidate.id && position.can_vote
                              ? accent.bg : undefined,
                          }}
                          onMouseEnter={() => position.can_vote && setHoveredCard(candidate.id)}
                          onMouseLeave={() => setHoveredCard(null)}
                        >
                          {/* Accent top bar on hover */}
                          <div style={{
                            position: "absolute", top: 0, left: 0, right: 0, height: 3,
                            background: accent.color, borderRadius: "16px 16px 0 0",
                            opacity: hoveredCard === candidate.id && position.can_vote ? 1 : 0,
                            transition: "opacity 0.25s"
                          }} />

                          <CandidateImage src={candidate.image_url} alt={candidate.name} size={72} />

                          <div className="candidate-name">{candidate.name}</div>

                          <div className="candidate-party">
                            {candidate.party?.badge_url && (
                              <img src={candidate.party.badge_url} alt={candidate.party.name} />
                            )}
                            <span>{candidate.party?.abbreviation || candidate.party?.name || "Independent"}</span>
                          </div>

                          {position.can_vote ? (
                            <button
                              className="vote-btn can-vote"
                              style={{ background: accent.color }}
                              onClick={() => openModal(candidate, position)}
                              disabled={voting}
                            >
                              Vote
                            </button>
                          ) : (
                            <button className="vote-btn voted" disabled>
                              {position.has_voted ? "✓ Vote cast" : "Voting closed"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* All done state */}
          {!loading && progressPct === 100 && (
            <div className="all-voted-banner">
              <div className="all-voted-icon">🎉</div>
              <div className="all-voted-title">All votes cast!</div>
              <div>Your ballot is complete. Thank you for participating.</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {showModal && selectedCandidate && (
        <div className="modal-overlay" onClick={() => !voting && setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-stripe" />
            <div className="modal-inner">

              {voteSuccess ? (
                <div className="modal-success">
                  <div className="modal-success-icon">✓</div>
                  <div className="modal-success-text">Vote recorded!</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                    You voted for {voteSuccess}
                  </div>
                </div>
              ) : (
                <>
                  <div className="modal-title">Confirm your vote</div>

                  <div className="modal-candidate-row">
                    <CandidateImage src={selectedCandidate.image_url} alt={selectedCandidate.name} size={72} />
                    <div className="modal-candidate-name">{selectedCandidate.name}</div>
                    <div className="modal-candidate-party">
                      {selectedCandidate.party?.name}
                      {selectedCandidate.party?.abbreviation && ` (${selectedCandidate.party.abbreviation})`}
                    </div>
                  </div>

                  <p className="modal-confirm-text">
                    You are casting your vote for <strong>{selectedCandidate.name}</strong> as{" "}
                    <strong>{selectedPosition.title}</strong>. This action cannot be undone.
                  </p>

                  {voteError && (
                    <div className="modal-error"><span>⚠</span>{voteError}</div>
                  )}

                  <div className="modal-actions">
                    <button className="modal-cancel" onClick={() => setShowModal(false)} disabled={voting}>
                      Cancel
                    </button>
                    <button className="modal-confirm" onClick={confirmVote} disabled={voting}>
                      {voting ? "Recording…" : "Confirm vote →"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}