import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import API from "../api";
import Navbar from "../components/Navbar";

// ── Palette ──
const PALETTE = [
  "#d21034", "#007a33", "#3b82f6", "#f59e0b",
  "#a855f7", "#06b6d4", "#f97316", "#ec4899",
];

// ── Shared tooltip style ──
const TT = {
  background: "#1c1c1c",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: "#fff",
  fontSize: 12,
  fontFamily: "'DM Sans', sans-serif",
  padding: "8px 12px",
};

// ── Count-up hook ──
function useCountUp(target, duration = 1000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let current = 0;
    const steps = 40;
    const step = target / steps;
    const interval = duration / steps;
    const t = setInterval(() => {
      current += step;
      if (current >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(current));
    }, interval);
    return () => clearInterval(t);
  }, [target, duration]);
  return val;
}

function StatCard({ label, value, sub, color = "#d21034", delay = 0 }) {
  const count = useCountUp(typeof value === "number" ? value : 0);
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14, padding: "1rem 1.25rem",
      borderTop: `3px solid ${color}`,
      animation: `fadeUp 0.5s ease ${delay}s both`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 700, color: "#fff" }}>
        {typeof value === "number" ? count.toLocaleString() : value}
      </div>
      {sub && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Avatar({ src, name, size = 44 }) {
  const [ok, setOk] = useState(false);
  return (
    <img src={src} alt={name}
      onLoad={() => setOk(true)}
      onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1a&color=666&size=128`; setOk(true); }}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)", flexShrink: 0, opacity: ok ? 1 : 0, transition: "opacity 0.3s" }}
    />
  );
}

function ChartTabBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "5px 13px", borderRadius: 8, border: "none", cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500,
      background: active ? "rgba(255,255,255,0.12)" : "none",
      color: active ? "#fff" : "rgba(255,255,255,0.38)",
      transition: "background 0.2s, color 0.2s",
    }}>{icon} {label}</button>
  );
}

function SectionCard({ children, style = {} }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 18, overflow: "hidden",
      marginBottom: "1.75rem",
      ...style,
    }}>{children}</div>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{
      padding: "1.1rem 1.5rem",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 10,
    }}>{children}</div>
  );
}

function SectionTitle({ children }) {
  return <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>{children}</span>;
}

// ── Generate mock trend data ──
function makeTrend(candidates, frame) {
  const labels = frame === "hourly"
    ? ["8AM","9AM","10AM","11AM","12PM","1PM","2PM","3PM","4PM","5PM"]
    : ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  return {
    labels,
    series: candidates.slice(0, 4).map((c, i) => ({
      name: c.name.split(" ").slice(-1)[0],
      fullName: c.name,
      color: PALETTE[i % PALETTE.length],
      data: labels.map((_, j) => {
        const progress = (j + 1) / labels.length;
        return Math.round(c.votes * progress * (0.85 + Math.random() * 0.3));
      }),
    })),
  };
}

export default function Results({ user: propUser }) {
  const [user] = useState(() => propUser || JSON.parse(localStorage.getItem("user")));
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePosId, setActivePosId] = useState(null);
  const [chartType, setChartType] = useState("bar");
  const [trendFrame, setTrendFrame] = useState("hourly");
  const [showComparison, setShowComparison] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    (async () => {
      try {
        const res = await API.get("/votes/results/1/");
        setResults(res.data);
        if (res.data.positions?.length) setActivePosId(res.data.positions[0].position_id);
      } catch {
        setError("Unable to load results. Please try again later.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const position = results?.positions?.find((p) => p.position_id === activePosId);
  const totalAll = results?.positions?.reduce((s, p) => s + p.candidates.reduce((ss, c) => ss + c.votes, 0), 0) || 0;
  const allCandidates = results?.positions?.reduce((s, p) => s + p.candidates.length, 0) || 0;

  const sorted = position ? [...position.candidates].sort((a, b) => b.votes - a.votes) : [];
  const posTotal = sorted.reduce((s, c) => s + c.votes, 0);
  const leader = sorted[0];

  const pieData = sorted.map((c, i) => ({ name: c.name.split(" ").slice(-1)[0], fullName: c.name, value: c.votes, color: PALETTE[i % PALETTE.length] }));
  const barData = sorted.map((c, i) => ({ name: c.name.split(" ").slice(-1)[0], fullName: c.name, votes: c.votes, pct: posTotal ? +((c.votes / posTotal) * 100).toFixed(1) : 0, fill: PALETTE[i % PALETTE.length] }));
  const radarData = sorted.slice(0, 6).map((c, i) => ({ subject: c.name.split(" ")[0], votes: c.votes, fullName: c.name }));

  const trendData = position ? makeTrend(sorted, trendFrame) : null;
  const lineChartData = trendData ? trendData.labels.map((label, i) => {
    const obj = { label };
    trendData.series.forEach((s) => { obj[s.name] = s.data[i]; });
    return obj;
  }) : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
        @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes popIn { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:none} }

        .rr { min-height:100vh; background:#0a0a0a; font-family:'DM Sans',sans-serif;
          background-image:
            radial-gradient(ellipse at 10% 20%, rgba(210,16,52,.05) 0%,transparent 50%),
            radial-gradient(ellipse at 85% 80%, rgba(0,122,51,.05) 0%,transparent 50%);
          padding-bottom:5rem;
        }
        .rr-inner { max-width:1080px; margin:0 auto; padding:2rem 1.25rem;
          opacity:0; transform:translateY(16px);
          transition:opacity .45s ease, transform .45s ease;
        }
        .rr-inner.on { opacity:1; transform:none; }

        .pos-tabs { display:flex; flex-wrap:wrap; gap:6px; }
        .pos-tab {
          padding:6px 16px; border-radius:99px; border:1px solid rgba(255,255,255,.1);
          font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500;
          color:rgba(255,255,255,.4); background:none; cursor:pointer;
          transition:background .2s, color .2s, border-color .2s;
        }
        .pos-tab.active { background:rgba(210,16,52,.15); border-color:rgba(210,16,52,.4); color:#fff; }
        .pos-tab:hover:not(.active) { background:rgba(255,255,255,.06); color:rgba(255,255,255,.7); }

        .chart-tabs { display:flex; gap:3px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:3px; }

        .skel { background:rgba(255,255,255,.06); border-radius:8px; animation:shimmer 1.5s infinite; }

        .cand-row { display:flex; align-items:center; gap:14px; padding:13px 0; border-bottom:1px solid rgba(255,255,255,.05); }
        .cand-row:last-child { border-bottom:none; }

        .cmp-table { width:100%; border-collapse:collapse; }
        .cmp-table th { font-size:11px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:rgba(255,255,255,.3); padding:10px 14px; text-align:left; border-bottom:1px solid rgba(255,255,255,.08); }
        .cmp-table td { font-size:13px; color:rgba(255,255,255,.65); padding:11px 14px; border-bottom:1px solid rgba(255,255,255,.05); }
        .cmp-table tr:last-child td { border:none; }
        .cmp-table tr:hover td { background:rgba(255,255,255,.03); }

        .winner-banner {
          display:flex; align-items:center; gap:14px;
          background:rgba(0,122,51,.08); border:1px solid rgba(0,180,80,.18);
          border-radius:14px; padding:1rem 1.25rem; margin-bottom:1rem;
          animation:popIn .4s ease;
        }
        .margin-pill { display:inline-flex; padding:2px 9px; border-radius:99px; font-size:10px; font-weight:700; }

        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:1.75rem; }
        @media(max-width:640px) { .stats-grid { grid-template-columns:1fr 1fr; } }
        @media(max-width:420px) { .stats-grid { grid-template-columns:1fr; } }
      `}</style>

      <Navbar user={user} />

      <div className="rr">
        <div className={`rr-inner${mounted ? " on" : ""}`}>

          {/* ── Header ── */}
          <div style={{ marginBottom: "1.75rem" }}>
            <button onClick={() => navigate("/dashboard")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.3)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, marginBottom: "1rem", padding: 0 }}
              onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,.65)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,.3)"}
            >← Back to ballot</button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 700, color: "#fff", letterSpacing: "-0.4px" }}>
                  📊 {results?.election_title || "Election"} Results
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.3)", marginTop: 4 }}>Live results · Auto-updating</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["#000","#d21034","#007a33"].map((c) => <span key={c} style={{ width: 28, height: 5, borderRadius: 3, background: c, display: "block" }} />)}
              </div>
            </div>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div>
              <div className="stats-grid">
                {[1,2,3,4].map((i) => <div key={i} className="skel" style={{ height: 80 }} />)}
              </div>
              {[1,2].map((i) => (
                <div key={i} style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 18, padding: "1.5rem", marginBottom: 16 }}>
                  <div className="skel" style={{ width: "40%", height: 16, marginBottom: 16 }} />
                  <div className="skel" style={{ height: 260 }} />
                </div>
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {!loading && error && (
            <div style={{ minHeight: "50vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center" }}>
              <div style={{ fontSize: 44 }}>📢</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>Something went wrong</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.35)" }}>{error}</div>
              <button onClick={() => navigate("/dashboard")} style={{ marginTop: 12, padding: "10px 22px", background: "#d21034", border: "none", borderRadius: 10, color: "#fff", fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>← Back to ballot</button>
            </div>
          )}

          {!loading && !error && results && (
            <>
              {/* ── Stat cards ── */}
              <div className="stats-grid">
                <StatCard label="Total votes" value={totalAll} sub="across all positions" color="#d21034" delay={0} />
                <StatCard label="Positions" value={results.positions.length} sub="contested" color="#007a33" delay={0.05} />
                <StatCard label="Candidates" value={allCandidates} sub="on the ballot" color="#3b82f6" delay={0.1} />
                <StatCard label="Leading party" value={leader?.party || "—"} sub={leader ? `in ${position?.position_title || ""}` : ""} color="#f59e0b" delay={0.15} />
              </div>

              {/* ── Position selector ── */}
              <SectionCard>
                <SectionHead>
                  <SectionTitle>Select position</SectionTitle>
                  <button
                    onClick={() => setShowComparison((s) => !s)}
                    style={{ padding: "5px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,.1)", background: showComparison ? "rgba(210,16,52,.15)" : "none", color: showComparison ? "#fff" : "rgba(255,255,255,.4)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, cursor: "pointer", transition: "all .2s" }}
                  >
                    {showComparison ? "✕ Hide" : "⊞ Show"} comparison
                  </button>
                </SectionHead>
                <div style={{ padding: "1rem 1.5rem" }}>
                  <div className="pos-tabs">
                    {results.positions.map((p) => (
                      <button key={p.position_id} className={`pos-tab${activePosId === p.position_id ? " active" : ""}`}
                        onClick={() => setActivePosId(p.position_id)}>
                        {p.position_title}
                      </button>
                    ))}
                  </div>
                </div>
              </SectionCard>

              {position && (
                <>
                  {/* ── Winner banner ── */}
                  {leader && posTotal > 0 && (
                    <div className="winner-banner">
                      <Avatar src={leader.image_url} name={leader.name} size={52} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(0,200,80,.7)", marginBottom: 2 }}>🏆 Current leader — {position.position_title}</div>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 700, color: "#fff" }}>{leader.name}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)", marginTop: 2 }}>
                          {leader.votes.toLocaleString()} votes · {posTotal ? ((leader.votes / posTotal) * 100).toFixed(1) : 0}% share
                        </div>
                      </div>
                      {sorted[1] && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>ahead by</div>
                          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: "#4ade80" }}>
                            {(leader.votes - sorted[1].votes).toLocaleString()}
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>votes</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Chart card ── */}
                  <SectionCard>
                    <SectionHead>
                      <SectionTitle>Vote distribution — {position.position_title}</SectionTitle>
                      <div className="chart-tabs">
                        <ChartTabBtn active={chartType === "bar"} onClick={() => setChartType("bar")} icon="▊" label="Bar" />
                        <ChartTabBtn active={chartType === "pie"} onClick={() => setChartType("pie")} icon="◕" label="Donut" />
                        <ChartTabBtn active={chartType === "radar"} onClick={() => setChartType("radar")} icon="◎" label="Radar" />
                      </div>
                    </SectionHead>
                    <div style={{ padding: "1.25rem 1.5rem" }}>
                      <div style={{ width: "100%", height: 300 }}>
                        <ResponsiveContainer>
                          {chartType === "bar" ? (
                            <BarChart data={barData} margin={{ top: 8, right: 16, left: -8, bottom: 16 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
                              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,.4)", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fill: "rgba(255,255,255,.3)", fontSize: 10, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={TT} cursor={{ fill: "rgba(255,255,255,.03)" }}
                                formatter={(v, n, p) => [`${v.toLocaleString()} votes (${p.payload.pct}%)`, p.payload.fullName]} />
                              <Bar dataKey="votes" radius={[7,7,0,0]} maxBarSize={54}>
                                {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                              </Bar>
                            </BarChart>
                          ) : chartType === "pie" ? (
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius="40%" outerRadius="66%"
                                paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800} labelLine={false}>
                                {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="rgba(0,0,0,.3)" strokeWidth={1} />)}
                              </Pie>
                              <Tooltip contentStyle={TT} formatter={(v, n, p) => [`${v.toLocaleString()} votes`, p.payload.fullName]} />
                              <Legend iconType="circle" iconSize={8}
                                formatter={(v, e) => <span style={{ color: "rgba(255,255,255,.5)", fontSize: 12, fontFamily: "DM Sans" }}>{e.payload.fullName}</span>} />
                            </PieChart>
                          ) : (
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                              <PolarGrid stroke="rgba(255,255,255,.08)" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,.4)", fontSize: 11, fontFamily: "DM Sans" }} />
                              <Radar name="Votes" dataKey="votes" stroke="#d21034" fill="#d21034" fillOpacity={0.15} strokeWidth={2} />
                              <Tooltip contentStyle={TT} formatter={(v) => [v.toLocaleString() + " votes", "Votes"]} />
                            </RadarChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </SectionCard>

                  {/* ── Trend line ── */}
                  <SectionCard>
                    <SectionHead>
                      <SectionTitle>📈 Voting trend</SectionTitle>
                      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: 3 }}>
                        {["hourly","weekly"].map((f) => (
                          <button key={f} onClick={() => setTrendFrame(f)} style={{
                            padding: "4px 13px", borderRadius: 7, border: "none", cursor: "pointer",
                            fontFamily: "'DM Sans',sans-serif", fontSize: 12,
                            background: trendFrame === f ? "rgba(255,255,255,.12)" : "none",
                            color: trendFrame === f ? "#fff" : "rgba(255,255,255,.35)",
                            transition: "all .2s",
                          }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                        ))}
                      </div>
                    </SectionHead>
                    <div style={{ padding: "1.25rem 1.5rem" }}>
                      <div style={{ width: "100%", height: 250 }}>
                        <ResponsiveContainer>
                          <LineChart data={lineChartData} margin={{ top: 8, right: 16, left: -8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,.35)", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "rgba(255,255,255,.3)", fontSize: 10, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={TT} formatter={(v, n) => [v.toLocaleString() + " votes", n]} />
                            <Legend iconType="circle" iconSize={7}
                              formatter={(v) => <span style={{ color: "rgba(255,255,255,.5)", fontSize: 12, fontFamily: "DM Sans" }}>{v}</span>} />
                            {trendData?.series.map((s) => (
                              <Line key={s.name} type="monotone" dataKey={s.name}
                                stroke={s.color} strokeWidth={2.5}
                                dot={{ fill: s.color, strokeWidth: 0, r: 3 }}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                                animationDuration={900} />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.2)", marginTop: 8, textAlign: "right" }}>
                        * Simulated cumulative trend data
                      </div>
                    </div>
                  </SectionCard>

                  {/* ── Candidate leaderboard ── */}
                  <SectionCard>
                    <SectionHead>
                      <SectionTitle>Candidate breakdown</SectionTitle>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>{posTotal.toLocaleString()} total votes</span>
                    </SectionHead>
                    <div style={{ padding: "0.5rem 1.5rem 1rem" }}>
                      {sorted.map((c, rank) => {
                        const pct = posTotal ? (c.votes / posTotal) * 100 : 0;
                        const color = PALETTE[rank % PALETTE.length];
                        const margin = rank === 0 && sorted[1]
                          ? ((c.votes - sorted[1].votes) / posTotal * 100).toFixed(1) : null;
                        return (
                          <div key={c.candidate_id} className="cand-row">
                            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: rank === 0 ? color : "rgba(255,255,255,.15)", width: 26, textAlign: "center", flexShrink: 0 }}>
                              {rank === 0 ? "👑" : rank + 1}
                            </div>
                            <Avatar src={c.image_url} name={c.name} size={42} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                                <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, color: "#fff" }}>{c.name}</span>
                                <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: `${color}1a`, border: `1px solid ${color}44`, color }}>
                                  {c.party}
                                </span>
                                {rank === 0 && margin && (
                                  <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: "rgba(210,16,52,.15)", border: "1px solid rgba(210,16,52,.3)", color: "#d21034" }}>
                                    +{margin}% lead
                                  </span>
                                )}
                              </div>
                              <div style={{ height: 5, background: "rgba(255,255,255,.07)", borderRadius: 99, overflow: "hidden", marginBottom: 4 }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 12, color: "rgba(255,255,255,.35)" }}>{c.votes.toLocaleString()} votes</span>
                                <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color }}>{pct.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>
                </>
              )}

              {/* ── Comparison table ── */}
              {showComparison && (
                <SectionCard style={{ animation: "fadeUp .35s ease" }}>
                  <SectionHead>
                    <SectionTitle>🏆 All positions — at a glance</SectionTitle>
                  </SectionHead>
                  <div style={{ padding: "0.75rem 1rem", overflowX: "auto" }}>
                    <table className="cmp-table">
                      <thead>
                        <tr>
                          <th>Position</th>
                          <th>Leader</th>
                          <th>Party</th>
                          <th>Votes</th>
                          <th>Share</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.positions.map((pos) => {
                          const s = [...pos.candidates].sort((a, b) => b.votes - a.votes);
                          const w = s[0];
                          const tot = s.reduce((x, c) => x + c.votes, 0);
                          const pct = tot ? ((w.votes / tot) * 100).toFixed(1) : 0;
                          const margin = s[1] ? ((w.votes - s[1].votes) / tot * 100).toFixed(1) : 100;
                          const tight = parseFloat(margin) < 10;
                          return (
                            <tr key={pos.position_id} style={{ cursor: "pointer" }}
                              onClick={() => { setActivePosId(pos.position_id); window.scrollTo({ top: 300, behavior: "smooth" }); }}>
                              <td style={{ color: "#fff", fontWeight: 500 }}>{pos.position_title}</td>
                              <td style={{ color: "#fff" }}>{w.name}</td>
                              <td>
                                <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,.07)", color: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.12)" }}>
                                  {w.party}
                                </span>
                              </td>
                              <td>{w.votes.toLocaleString()}</td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ width: 60, height: 4, background: "rgba(255,255,255,.08)", borderRadius: 99, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${pct}%`, background: "#007a33", borderRadius: 99 }} />
                                  </div>
                                  <span style={{ fontSize: 12, color: "rgba(255,255,255,.55)" }}>{pct}%</span>
                                </div>
                              </td>
                              <td>
                                <span className="margin-pill" style={{
                                  background: tight ? "rgba(210,16,52,.12)" : "rgba(0,122,51,.12)",
                                  border: `1px solid ${tight ? "rgba(210,16,52,.3)" : "rgba(0,180,80,.25)"}`,
                                  color: tight ? "#fc8181" : "#4ade80",
                                }}>
                                  {tight ? "⚡ Tight race" : `+${margin}% lead`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}