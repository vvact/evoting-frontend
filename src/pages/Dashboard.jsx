import React, { useEffect, useState } from "react";
import API from "../api";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";

const POSITION_ACCENTS = {
  Governor: { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", label: "GOV" },
  Senator:  { color: "#a855f7", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.25)", label: "SEN" },
  "Members of the County Assembly": { color: "#007a33", bg: "rgba(0,122,51,0.08)", border: "rgba(0,122,51,0.25)", label: "MCA" },
};

const DEFAULT_ACCENT = { color: "#888", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.12)", label: "POS" };

function CandidateImage({ src, alt, size = 80 }) {
  const [loaded, setLoaded] = useState(false);
  const { theme } = useTheme();
  
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", position: "relative", flexShrink: 0 }}>
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: theme === 'dark' ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", 
          animation: "shimmer 1.5s infinite"
        }} />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=${theme === 'dark' ? '1a1a2e' : 'e9edf2'}&color=${theme === 'dark' ? '888' : '666'}&size=128`; }}
        style={{
          width: size, height: size, borderRadius: "50%", objectFit: "cover",
          border: theme === 'dark' ? "2px solid rgba(255,255,255,0.1)" : "2px solid rgba(0,0,0,0.1)",
          opacity: loaded ? 1 : 0, transition: "opacity 0.4s ease"
        }}
      />
    </div>
  );
}

function SkeletonCard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div style={{
      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
      border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.08)",
      borderRadius: 16, padding: "1.5rem", display: "flex", flexDirection: "column",
      alignItems: "center", gap: 12
    }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", animation: "shimmer 1.5s infinite" }} />
      <div style={{ width: "60%", height: 14, borderRadius: 8, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", animation: "shimmer 1.5s infinite" }} />
      <div style={{ width: "40%", height: 11, borderRadius: 8, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", animation: "shimmer 1.5s infinite" }} />
      <div style={{ width: "100%", height: 38, borderRadius: 10, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", animation: "shimmer 1.5s infinite", marginTop: 4 }} />
    </div>
  );
}

export default function Dashboard({ user: propUser }) {
  const { theme } = useTheme();
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

  const isDark = theme === 'dark';

  if (!user) return (
    <div className={`min-h-screen flex items-center justify-center font-sans ${isDark ? 'bg-gray-900 text-white/40' : 'bg-gray-50 text-gray-500'}`}>
      Please log in to access the dashboard.
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .dash-root {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          padding-bottom: 4rem;
        }
        
        /* Light mode */
        .dash-root.light-mode {
          background: linear-gradient(135deg, #f5f7fa 0%, #e9edf2 100%);
        }
        
        /* Dark mode */
        .dash-root.dark-mode {
          background: #1a1a2e;
          background-image:
            radial-gradient(ellipse at 10% 20%, rgba(0,122,51,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 90% 80%, rgba(210,16,52,0.06) 0%, transparent 50%);
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
        .light-mode .dash-title { color: #1a1a2e; }
        .dark-mode .dash-title { color: #fff; }
        .dash-title {
          font-family: 'Sora', sans-serif;
          font-size: 26px; font-weight: 700; letter-spacing: -0.4px;
        }
        .light-mode .dash-subtitle { color: rgba(0,0,0,0.5); }
        .dark-mode .dash-subtitle { color: rgba(255,255,255,0.35); }
        .dash-subtitle { font-size: 13px; margin-top: 3px; }

        /* ── Ballot progress bar ── */
        .ballot-progress {
          border-radius: 14px;
          padding: 1rem 1.25rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .light-mode .ballot-progress {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .dark-mode .ballot-progress {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .light-mode .bp-title { color: rgba(0,0,0,0.5); }
        .dark-mode .bp-title { color: rgba(255,255,255,0.35); }
        .bp-title { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; }
        .light-mode .bp-track { background: rgba(0,0,0,0.08); }
        .dark-mode .bp-track { background: rgba(255,255,255,0.07); }
        .bp-track { height: 6px; border-radius: 99px; overflow: hidden; }
        .bp-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #d21034, #007a33); transition: width 0.6s ease; }
        .light-mode .bp-count { color: #1a1a2e; }
        .dark-mode .bp-count { color: #fff; }
        .bp-count { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; white-space: nowrap; }
        .light-mode .bp-count span { color: rgba(0,0,0,0.4); }
        .dark-mode .bp-count span { color: rgba(255,255,255,0.3); }
        .bp-count span { font-size: 13px; font-weight: 400; }

        /* ── Election section ── */
        .election-section {
          margin-bottom: 2rem;
          border-radius: 18px;
          overflow: hidden;
        }
        .light-mode .election-section {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .dark-mode .election-section {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .light-mode .election-head { border-bottom-color: rgba(0,0,0,0.06); }
        .dark-mode .election-head { border-bottom-color: rgba(255,255,255,0.06); }
        .election-head {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid;
          display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
        }
        .light-mode .election-title { color: #1a1a2e; }
        .dark-mode .election-title { color: #fff; }
        .election-title {
          font-family: 'Sora', sans-serif;
          font-size: 16px; font-weight: 700;
        }
        .light-mode .election-desc { color: rgba(0,0,0,0.5); }
        .dark-mode .election-desc { color: rgba(255,255,255,0.35); }
        .election-desc { font-size: 12px; margin-top: 3px; }

        /* ── Position group ── */
        .light-mode .position-group { border-bottom-color: rgba(0,0,0,0.05); }
        .dark-mode .position-group { border-bottom-color: rgba(255,255,255,0.05); }
        .position-group { padding: 1.25rem 1.5rem; border-bottom: 1px solid; }
        .position-group:last-child { border-bottom: none; }
        .position-label-row {
          display: flex; align-items: center; gap: 10px; margin-bottom: 1rem;
        }
        .position-badge {
          padding: 3px 10px; border-radius: 99px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          border: 1px solid;
        }
        .light-mode .position-title { color: #1a1a2e; }
        .dark-mode .position-title { color: #fff; }
        .position-title {
          font-family: 'Sora', sans-serif;
          font-size: 15px; font-weight: 600;
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
          border-radius: 16px;
          padding: 1.25rem 1rem;
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 10px;
          transition: border-color 0.25s, background 0.25s, transform 0.2s;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .light-mode .candidate-card {
          background: rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.08);
        }
        .dark-mode .candidate-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
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

        .light-mode .candidate-name { color: #1a1a2e; }
        .dark-mode .candidate-name { color: #fff; }
        .candidate-name {
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 600; line-height: 1.3;
        }
        .light-mode .candidate-party { color: rgba(0,0,0,0.5); }
        .dark-mode .candidate-party { color: rgba(255,255,255,0.4); }
        .candidate-party {
          display: flex; align-items: center; justify-content: center; gap: 5px;
          font-size: 12px;
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
          border-radius: 20px;
          max-width: 400px; width: 100%;
          overflow: hidden;
          animation: popIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275);
        }
        .light-mode .modal-card {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.1);
        }
        .dark-mode .modal-card {
          background: #16213e;
          border: 1px solid rgba(255,255,255,0.1);
        }
        @keyframes popIn { from { opacity:0; transform:scale(0.85) translateY(16px); } to { opacity:1; transform:none; } }
        .modal-stripe { height: 4px; background: linear-gradient(90deg,#000 0%,#d21034 50%,#007a33 100%); }
        .modal-inner { padding: 2rem; text-align: center; }
        .light-mode .modal-title { color: #1a1a2e; }
        .dark-mode .modal-title { color: #fff; }
        .modal-title {
          font-family: 'Sora', sans-serif;
          font-size: 18px; font-weight: 700; margin-bottom: 1.5rem;
        }
        .light-mode .modal-candidate-row {
          background: rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.08);
        }
        .dark-mode .modal-candidate-row {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .modal-candidate-row {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          border-radius: 14px; padding: 1.25rem; margin-bottom: 1rem;
        }
        .light-mode .modal-candidate-name { color: #1a1a2e; }
        .dark-mode .modal-candidate-name { color: #fff; }
        .modal-candidate-name { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 700; }
        .light-mode .modal-candidate-party { color: rgba(0,0,0,0.5); }
        .dark-mode .modal-candidate-party { color: rgba(255,255,255,0.4); }
        .modal-candidate-party { font-size: 13px; }
        .light-mode .modal-confirm-text { color: rgba(0,0,0,0.5); }
        .dark-mode .modal-confirm-text { color: rgba(255,255,255,0.35); }
        .modal-confirm-text { font-size: 13px; line-height: 1.6; margin-bottom: 1.5rem; }
        .light-mode .modal-confirm-text strong { color: rgba(0,0,0,0.7); }
        .dark-mode .modal-confirm-text strong { color: rgba(255,255,255,0.7); }
        .modal-confirm-text strong { font-weight: 500; }

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
        .light-mode .modal-cancel {
          background: rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.1);
          color: rgba(0,0,0,0.6);
        }
        .dark-mode .modal-cancel {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6);
        }
        .modal-cancel {
          flex: 1; padding: 11px; border-radius: 10px; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500; transition: background 0.2s;
        }
        .light-mode .modal-cancel:hover { background: rgba(0,0,0,0.09); }
        .dark-mode .modal-cancel:hover { background: rgba(255,255,255,0.09); }
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
          text-align: center; padding: 3rem 1rem;
        }
        .light-mode .all-voted-banner { color: rgba(0,0,0,0.4); }
        .dark-mode .all-voted-banner { color: rgba(255,255,255,0.3); }
        .all-voted-icon { font-size: 40px; margin-bottom: 10px; }
        .light-mode .all-voted-title { color: #1a1a2e; }
        .dark-mode .all-voted-title { color: #fff; }
        .all-voted-title { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 6px; }

        @media (max-width: 600px) {
          .candidates-grid { grid-template-columns: 1fr 1fr; }
          .dash-title { font-size: 20px; }
        }
        @media (max-width: 380px) {
          .candidates-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <Navbar user={user} />

      <div className={`dash-root ${isDark ? 'dark-mode' : 'light-mode'}`}>
        {/* Theme Toggle Button */}
        <div className="fixed top-20 right-4 z-50">
          <ThemeToggle />
        </div>

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
                <div key={s} style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.08)", borderRadius: 18, overflow: "hidden" }}>
                  <div style={{ padding: "1.25rem 1.5rem", borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ width: "35%", height: 16, borderRadius: 8, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", animation: "shimmer 1.5s infinite" }} />
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
                  <div style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>
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