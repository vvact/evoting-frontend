import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import Navbar from "../components/Navbar";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  RadialBarChart, RadialBar,
} from "recharts";

// ── Palette: 8 distinct colors for candidates/parties ──
const PALETTE = [
  "#d21034", "#007a33", "#3b82f6", "#f59e0b",
  "#a855f7", "#06b6d4", "#f97316", "#ec4899",
];

// ── Tooltip styles shared ──
const TOOLTIP_STYLE = {
  background: "#1a1a1a",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  color: "#fff",
  fontSize: 12,
  fontFamily: "DM Sans, sans-serif",
};

// ── Custom Pie label ──
function PieLabel({ cx, cy, midAngle, outerRadius, percent, name }) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = outerRadius + 24;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="rgba(255,255,255,0.6)" textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central" style={{ fontSize: 11, fontFamily: "DM Sans, sans-serif" }}>
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

// ── Animated count-up ──
function CountUp({ target, duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <>{val.toLocaleString()}</>;
}

// ── Candidate avatar with fallback ──
function Avatar({ src, name, size = 44 }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", position: "relative", flexShrink: 0 }}>
      <img src={src} alt={name}
        onLoad={() => setLoaded(true)}
        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1a&color=888&size=128`; }}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)", opacity: loaded ? 1 : 0, transition: "opacity 0.4s" }}
      />
    </div>
  );
}

// ── Leader badge ──
function LeaderBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 8px", borderRadius: 99,
      background: "rgba(210,16,52,0.15)", border: "1px solid rgba(210,16,52,0.35)",
      fontSize: 10, fontWeight: 700, color: "#d21034", letterSpacing: "0.06em",
    }}>
      👑 LEADING
    </span>
  );
}

export default function Results({ user: propUser }) {
  const [user] = useState(() => propUser || JSON.parse(localStorage.getItem("user")));
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState({}); // positionId -> "bar"|"pie"|"radial"
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    const fetchResults = async () => {
      try {
        const res = await API.get("/votes/results/1/");
        setResults(res.data);
      } catch (err) {
        setError("Unable to load results. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const getTab = (posId) => activeTab[posId] || "bar";
  const setTab = (posId, tab) => setActiveTab((p) => ({ ...p, [posId]: tab }));

  // ── Aggregate stats ──
  const totalVotesAll = results?.positions?.reduce((s, p) =>
    s + p.candidates.reduce((ss, c) => ss + c.votes, 0), 0) || 0;
  const totalPositions = results?.positions?.length || 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }

        .results-root {
          min-height: 100vh;
          background: #0a0a0a;
          background-image:
            radial-gradient(ellipse at 15% 25%, rgba(210,16,52,0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 85% 75%, rgba(0,122,51,0.05) 0%, transparent 50%);
          font-family: 'DM Sans', sans-serif;
          padding-bottom: 5rem;
        }

        .results-inner {
          max-width: 1050px; margin: 0 auto; padding: 2rem 1.25rem;
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.45s ease, transform 0.45s ease;
        }
        .results-inner.mounted { opacity: 1; transform: none; }

        /* ── Page header ── */
        .results-header { margin-bottom: 2rem; }
        .results-back {
          display: inline-flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          color: rgba(255,255,255,0.35); margin-bottom: 1.25rem;
          padding: 0; transition: color 0.2s;
        }
        .results-back:hover { color: rgba(255,255,255,0.7); }
        .results-title {
          font-family: 'Sora', sans-serif;
          font-size: 26px; font-weight: 700; color: #fff; letter-spacing: -0.4px;
        }
        .results-subtitle { font-size: 13px; color: rgba(255,255,255,0.35); margin-top: 4px; }

        /* ── Stat cards row ── */
        .stat-cards {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px; margin-bottom: 2rem;
        }
        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 1rem 1.25rem;
        }
        .stat-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.07em;
          text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 6px;
        }
        .stat-value {
          font-family: 'Sora', sans-serif; font-size: 26px; font-weight: 700; color: #fff;
        }
        .stat-sub { font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 3px; }

        /* ── Position section ── */
        .position-section {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px; overflow: hidden;
          margin-bottom: 1.75rem;
        }
        .position-head {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
        }
        .position-head-left {}
        .position-title { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 700; color: #fff; }
        .position-meta { font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 3px; }

        /* ── Tab switcher ── */
        .chart-tabs {
          display: flex; gap: 4px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 3px;
        }
        .chart-tab {
          padding: 5px 12px; border-radius: 8px; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          color: rgba(255,255,255,0.4); background: none;
          transition: background 0.2s, color 0.2s;
          display: flex; align-items: center; gap: 5px;
        }
        .chart-tab.active { background: rgba(255,255,255,0.1); color: #fff; }

        /* ── Chart area ── */
        .chart-area { padding: 1.25rem 1.5rem; }

        /* ── Candidate leaderboard ── */
        .candidate-row {
          display: flex; align-items: center; gap: 14px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background 0.15s;
        }
        .candidate-row:last-child { border-bottom: none; }
        .rank-num {
          font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 700;
          color: rgba(255,255,255,0.15); width: 28px; text-align: center; flex-shrink: 0;
        }
        .rank-num.top { color: #d21034; }
        .candidate-info { flex: 1; min-width: 0; }
        .candidate-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .candidate-name { font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600; color: #fff; }
        .party-chip {
          padding: 2px 8px; border-radius: 99px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
          border: 1px solid; flex-shrink: 0;
        }
        .vote-bar-wrap { margin-top: 6px; }
        .vote-bar-track {
          height: 5px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden;
        }
        .vote-bar-fill {
          height: 100%; border-radius: 99px;
          transition: width 1s cubic-bezier(0.4,0,0.2,1);
        }
        .vote-count-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 4px;
        }
        .vote-count { font-size: 12px; color: rgba(255,255,255,0.4); }
        .vote-pct { font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 700; }

        /* ── Winner banner ── */
        .winner-banner {
          display: flex; align-items: center; gap: 14px;
          background: rgba(0,122,51,0.08);
          border: 1px solid rgba(0,180,80,0.2);
          border-radius: 14px; padding: 1rem 1.25rem;
          margin-bottom: 1rem;
        }
        .winner-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(0,200,80,0.7); margin-bottom: 2px; }
        .winner-name { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 700; color: #fff; }
        .winner-sub { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 1px; }

        /* ── Shimmer skeleton ── */
        @keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .skel { background: rgba(255,255,255,0.06); border-radius: 8px; animation: shimmer 1.5s infinite; }

        /* ── Error / empty ── */
        .results-empty {
          min-height: 60vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center; gap: 10px;
        }
        .results-empty-icon { font-size: 44px; margin-bottom: 8px; }
        .results-empty-title { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 700; color: #fff; }
        .results-empty-sub { font-size: 13px; color: rgba(255,255,255,0.35); }
        .results-empty-btn {
          margin-top: 1rem; padding: 10px 22px; border: none; border-radius: 10px;
          background: #d21034; color: #fff; cursor: pointer;
          font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600;
          transition: background 0.2s;
        }
        .results-empty-btn:hover { background: #b00e2a; }

        @media (max-width: 520px) {
          .stat-cards { grid-template-columns: 1fr 1fr; }
          .position-head { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <Navbar user={user} />

      <div className="results-root">
        <div className={`results-inner${mounted ? " mounted" : ""}`}>

          {/* Back button & title */}
          <div className="results-header">
            <button className="results-back" onClick={() => navigate("/dashboard")}>
              ← Back to ballot
            </button>
            <div className="results-title">
              📊 {results?.election_title || "Election"} Results
            </div>
            <div className="results-subtitle">
              Live results · Updates automatically
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
                {[1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 80 }} />)}
              </div>
              {[1, 2].map((s) => (
                <div key={s} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "1.5rem" }}>
                  <div className="skel" style={{ width: "40%", height: 18, marginBottom: 16 }} />
                  <div className="skel" style={{ height: 220 }} />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="results-empty">
              <div className="results-empty-icon">📢</div>
              <div className="results-empty-title">Something went wrong</div>
              <div className="results-empty-sub">{error}</div>
              <button className="results-empty-btn" onClick={() => navigate("/dashboard")}>← Back to ballot</button>
            </div>
          )}

          {/* No results */}
          {!loading && !error && !results && (
            <div className="results-empty">
              <div className="results-empty-icon">🗳</div>
              <div className="results-empty-title">No results yet</div>
              <div className="results-empty-sub">Results will appear here once voting begins.</div>
              <button className="results-empty-btn" onClick={() => navigate("/dashboard")}>← Back to ballot</button>
            </div>
          )}

          {/* Main results */}
          {!loading && !error && results && (
            <>
              {/* Stat cards */}
              <div className="stat-cards">
                <div className="stat-card">
                  <div className="stat-label">Total votes cast</div>
                  <div className="stat-value"><CountUp target={totalVotesAll} /></div>
                  <div className="stat-sub">across all positions</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Positions contested</div>
                  <div className="stat-value">{totalPositions}</div>
                  <div className="stat-sub">in this election</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Candidates</div>
                  <div className="stat-value">
                    {results.positions.reduce((s, p) => s + p.candidates.length, 0)}
                  </div>
                  <div className="stat-sub">on the ballot</div>
                </div>
              </div>

              {/* Per-position sections */}
              {results.positions.map((position, posIdx) => {
                const total = position.candidates.reduce((s, c) => s + c.votes, 0);
                const sorted = [...position.candidates].sort((a, b) => b.votes - a.votes);
                const leader = sorted[0];
                const tab = getTab(position.position_id);

                // Chart data
                const pieData = sorted.map((c, i) => ({
                  name: c.name.split(" ").slice(-1)[0], // last name for brevity
                  fullName: c.name,
                  value: c.votes,
                  color: PALETTE[i % PALETTE.length],
                }));
                const barData = sorted.map((c, i) => ({
                  name: c.name.split(" ").slice(-1)[0],
                  fullName: c.name,
                  votes: c.votes,
                  pct: total ? +((c.votes / total) * 100).toFixed(1) : 0,
                  fill: PALETTE[i % PALETTE.length],
                }));
                const radialData = sorted.map((c, i) => ({
                  name: c.name.split(" ").slice(-1)[0],
                  fullName: c.name,
                  uv: total ? +((c.votes / total) * 100).toFixed(1) : 0,
                  fill: PALETTE[i % PALETTE.length],
                }));

                return (
                  <div key={position.position_id} className="position-section"
                    style={{ animationDelay: `${posIdx * 0.1}s` }}>

                    {/* Section header */}
                    <div className="position-head">
                      <div className="position-head-left">
                        <div className="position-title">{position.position_title}</div>
                        <div className="position-meta">
                          {total.toLocaleString()} votes · {sorted.length} candidates
                        </div>
                      </div>
                      <div className="chart-tabs">
                        {[
                          { id: "bar", icon: "▊", label: "Bar" },
                          { id: "pie", icon: "◕", label: "Pie" },
                          { id: "radial", icon: "◎", label: "Radial" },
                        ].map((t) => (
                          <button key={t.id}
                            className={`chart-tab${tab === t.id ? " active" : ""}`}
                            onClick={() => setTab(position.position_id, t.id)}>
                            <span>{t.icon}</span>{t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="chart-area">
                      {/* Winner highlight */}
                      {leader && total > 0 && (
                        <div className="winner-banner">
                          <Avatar src={leader.image_url} name={leader.name} size={48} />
                          <div>
                            <div className="winner-label">🏆 Current leader</div>
                            <div className="winner-name">{leader.name}</div>
                            <div className="winner-sub">
                              {leader.votes.toLocaleString()} votes · {total ? ((leader.votes / total) * 100).toFixed(1) : 0}%
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── BAR CHART ── */}
                      {tab === "bar" && (
                        <div style={{ width: "100%", height: 280, marginBottom: "1.5rem" }}>
                          <ResponsiveContainer>
                            <BarChart data={barData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "DM Sans" }}
                                axisLine={false} tickLine={false} />
                              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "DM Sans" }}
                                axisLine={false} tickLine={false} />
                              <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                                formatter={(val, name, props) => [
                                  `${val.toLocaleString()} votes (${props.payload.pct}%)`,
                                  props.payload.fullName
                                ]}
                              />
                              <Bar dataKey="votes" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                {barData.map((entry, i) => (
                                  <Cell key={i} fill={entry.fill} fillOpacity={0.9} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* ── PIE CHART ── */}
                      {tab === "pie" && (
                        <div style={{ width: "100%", height: 300, marginBottom: "1.5rem" }}>
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%" cy="50%"
                                innerRadius="45%" outerRadius="70%"
                                paddingAngle={3}
                                dataKey="value"
                                labelLine={false}
                                label={PieLabel}
                                animationBegin={0}
                                animationDuration={900}
                              >
                                {pieData.map((entry, i) => (
                                  <Cell key={i} fill={entry.color} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(val, name, props) => [
                                  `${val.toLocaleString()} votes`,
                                  props.payload.fullName
                                ]}
                              />
                              <Legend
                                formatter={(value, entry) => (
                                  <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, fontFamily: "DM Sans" }}>
                                    {entry.payload.fullName}
                                  </span>
                                )}
                                iconType="circle" iconSize={8}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* ── RADIAL BAR CHART ── */}
                      {tab === "radial" && (
                        <div style={{ width: "100%", height: 300, marginBottom: "1.5rem" }}>
                          <ResponsiveContainer>
                            <RadialBarChart
                              cx="50%" cy="50%"
                              innerRadius="20%" outerRadius="90%"
                              data={radialData}
                              startAngle={180} endAngle={0}
                            >
                              <RadialBar
                                minAngle={8}
                                background={{ fill: "rgba(255,255,255,0.04)" }}
                                clockWise={false}
                                dataKey="uv"
                                label={{ position: "insideStart", fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                              >
                                {radialData.map((entry, i) => (
                                  <Cell key={i} fill={entry.fill} />
                                ))}
                              </RadialBar>
                              <Legend
                                iconSize={10} iconType="circle"
                                formatter={(value, entry) => (
                                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "DM Sans" }}>
                                    {entry.payload.fullName} — {entry.payload.uv}%
                                  </span>
                                )}
                              />
                              <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(val, name, props) => [`${val}%`, props.payload.fullName]}
                              />
                            </RadialBarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* ── Leaderboard list ── */}
                      <div>
                        {sorted.map((candidate, rank) => {
                          const pct = total ? (candidate.votes / total) * 100 : 0;
                          const color = PALETTE[rank % PALETTE.length];
                          return (
                            <div key={candidate.candidate_id} className="candidate-row">
                              <div className={`rank-num${rank === 0 ? " top" : ""}`}>{rank + 1}</div>
                              <Avatar src={candidate.image_url} name={candidate.name} size={40} />
                              <div className="candidate-info">
                                <div className="candidate-name-row">
                                  <span className="candidate-name">{candidate.name}</span>
                                  <span className="party-chip"
                                    style={{ background: `${color}18`, borderColor: `${color}40`, color }}>
                                    {candidate.party}
                                  </span>
                                  {rank === 0 && total > 0 && <LeaderBadge />}
                                </div>
                                <div className="vote-bar-wrap">
                                  <div className="vote-bar-track">
                                    <div className="vote-bar-fill"
                                      style={{ width: `${pct}%`, background: color }} />
                                  </div>
                                  <div className="vote-count-row">
                                    <span className="vote-count">
                                      <CountUp target={candidate.votes} /> votes
                                    </span>
                                    <span className="vote-pct" style={{ color }}>
                                      {pct.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </>
  );
}