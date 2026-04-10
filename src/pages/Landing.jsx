import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../api";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";

// ── Animated count-up ──
function CountUp({ target, suffix = "", duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const steps = 60;
      const step = target / steps;
      const t = setInterval(() => {
        start += step;
        if (start >= target) { setVal(target); clearInterval(t); }
        else setVal(Math.floor(start));
      }, duration / steps);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ── Banner messages ──
const BANNERS = [
  { icon: "🗳️", title: "Voter registration is open", msg: "Deadline: July 20, 2025 — make sure your details are up to date.", cta: "Register now", link: "/register", urgency: "high" },
  { icon: "📢", title: "Poll worker applications", msg: "We're hiring election officials. Training provided. Apply by June 15.", cta: "Apply here", link: "/volunteer", urgency: "medium" },
  { icon: "✅", title: "Early voting now available", msg: "Skip the lines — vote early at any county election office.", cta: "Find locations", link: "/early-voting", urgency: "medium" },
  { icon: "🔐", title: "Security update", msg: "Two-factor authentication is now required for all voters.", cta: "Set up 2FA", link: "/security", urgency: "low" },
];

const URGENCY_COLOR = { high: "#d21034", medium: "#007a33", low: "#3b82f6" };

const GUIDELINES = [
  { icon: "🔒", text: "Each registered voter can vote only once per election." },
  { icon: "🪪", text: "National ID verification is required before voting." },
  { icon: "📜", text: "Votes are securely recorded and cannot be modified." },
  { icon: "🔍", text: "All results are transparently counted and auditable." },
];

const STATS = [
  { value: 48, suffix: "M+", label: "Registered voters" },
  { value: 99, suffix: ".9%", label: "Uptime guarantee" },
  { value: 256, suffix: "-bit", label: "Encryption standard" },
  { value: 2013, suffix: "", label: "Founded" },
];

export default function Landing() {
  const { call } = useApi();
  const { theme } = useTheme();
  const [activeElection, setActiveElection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [electionId, setElectionId] = useState("");
  const [slide, setSlide] = useState(0);
  const [fading, setFading] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [guidelinesOpen, setGuidelinesOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-rotate banner
  useEffect(() => {
    if (!bannerVisible) return;
    const id = setInterval(() => changeSlide((slide + 1) % BANNERS.length), 5000);
    return () => clearInterval(id);
  }, [slide, bannerVisible]);

  const changeSlide = (next) => {
    setFading(true);
    setTimeout(() => { setSlide(next); setFading(false); }, 280);
  };

  const fetchElection = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await call({ url: "/elections/active/", method: "GET" });
      setActiveElection(res);
    } catch {
      setFetchError("Could not find an active election. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const cur = BANNERS[slide];
  const isDark = theme === 'dark';

  return (
    <div className={`land-root ${isDark ? 'dark-mode' : 'light-mode'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');
        
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes floatA { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-18px) rotate(4deg)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(-3deg)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 24px rgba(210,16,52,.15)} 50%{box-shadow:0 0 48px rgba(210,16,52,.3)} }

        .land-root {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
          transition: background 0.3s ease;
        }
        
        /* Light mode */
        .land-root.light-mode {
          background: linear-gradient(135deg, #f5f7fa 0%, #e9edf2 100%);
        }
        
        /* Dark mode */
        .land-root.dark-mode {
          background: #1a1a2e;
          background-image:
            radial-gradient(ellipse at 10% 20%, rgba(0,122,51,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 90% 80%, rgba(210,16,52,0.06) 0%, transparent 50%);
        }

        /* ── Background mesh ── */
        .bg-mesh {
          position:fixed; inset:0; pointer-events:none; z-index:0;
        }
        .light-mode .bg-mesh {
          background:
            radial-gradient(ellipse at 15% 20%, rgba(210,16,52,.05) 0%, transparent 45%),
            radial-gradient(ellipse at 85% 75%, rgba(0,122,51,.04) 0%, transparent 45%);
        }
        .dark-mode .bg-mesh {
          background:
            radial-gradient(ellipse at 15% 20%, rgba(210,16,52,.15) 0%, transparent 45%),
            radial-gradient(ellipse at 85% 75%, rgba(0,122,51,.12) 0%, transparent 45%),
            radial-gradient(ellipse at 50% 50%, rgba(255,255,255,.03) 0%, transparent 70%);
        }

        /* ── Floating orbs ── */
        .orb {
          position:fixed; border-radius:50%; filter:blur(70px); pointer-events:none; z-index:0;
        }
        .light-mode .orb { opacity: 0.15; }
        .dark-mode .orb { opacity: 0.2; }
        .orb-a { width:400px; height:400px; background:#d21034; top:-100px; left:-100px; animation:floatA 12s ease-in-out infinite; }
        .orb-b { width:350px; height:350px; background:#007a33; bottom:-80px; right:-80px; animation:floatB 10s ease-in-out infinite; }

        /* ── Announcement banner ── */
        .ann-banner {
          position:relative; z-index:10;
          padding:10px 1.25rem;
          display:flex; align-items:center; justify-content:space-between; gap:12px;
          transition: opacity .3s, max-height .4s;
        }
        .light-mode .ann-banner {
          background: rgba(0,0,0,0.03);
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        .dark-mode .ann-banner {
          background: rgba(0,0,0,0.3);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .ann-dot { width:7px; height:7px; border-radius:50%; animation:pulse 1.5s infinite; flex-shrink:0; }
        .ann-msg { flex:1; font-size:13px; transition:opacity .28s, transform .28s; }
        .light-mode .ann-msg { color: rgba(0,0,0,0.7); }
        .dark-mode .ann-msg { color: rgba(255,255,255,0.7); }
        .ann-msg.fading { opacity:0; transform:translateY(-3px); }
        .ann-cta {
          padding:4px 14px; border-radius:99px; border:none; cursor:pointer;
          font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; color:#fff;
          white-space:nowrap; transition:opacity .2s;
        }
        .ann-cta:hover { opacity:.85; }
        .ann-dots { display:flex; gap:5px; flex-shrink:0; }
        .ann-slide-dot { height:3px; border-radius:99px; border:none; cursor:pointer; padding:0; transition:width .25s, background .25s; }
        .light-mode .ann-slide-dot { background: rgba(0,0,0,0.2); }
        .dark-mode .ann-slide-dot { background: rgba(255,255,255,0.2); }
        .ann-close { background:none; border:none; font-size:18px; cursor:pointer; padding:0 4px; transition:color .2s; line-height:1; }
        .light-mode .ann-close { color: rgba(0,0,0,0.4); }
        .dark-mode .ann-close { color: rgba(255,255,255,0.3); }
        .light-mode .ann-close:hover { color: rgba(0,0,0,0.7); }
        .dark-mode .ann-close:hover { color: #fff; }

        /* ── Hero ── */
        .hero {
          position:relative; z-index:1;
          display:flex; flex-direction:column; align-items:center;
          text-align:center; padding:4rem 1.25rem 3rem;
          animation:fadeUp .7s ease both;
        }
        .hero-flag { display:flex; gap:6px; margin-bottom:1.5rem; }
        .hero-flag-bar { width:32px; height:6px; border-radius:3px; }

        .hero-badge {
          display:inline-flex; align-items:center; gap:7px;
          padding:5px 16px; border-radius:99px;
          font-size:12px; margin-bottom:1.5rem;
        }
        .light-mode .hero-badge {
          background: rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.1);
          color: rgba(0,0,0,0.6);
        }
        .dark-mode .hero-badge {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.5);
        }
        .hero-badge-dot { width:6px; height:6px; border-radius:50%; background:#4ade80; animation:pulse 1.5s infinite; }

        .hero-title {
          font-family:'Sora',sans-serif; font-size:clamp(32px,6vw,68px); font-weight:800;
          line-height:1.08; letter-spacing:-1.5px; margin-bottom:1.25rem;
        }
        .light-mode .hero-title { color: #1a1a2e; }
        .dark-mode .hero-title { color: #fff; }
        .hero-title-accent { color:#d21034; }

        .hero-sub {
          font-size:clamp(14px,2vw,18px);
          max-width:520px; line-height:1.7; margin-bottom:2.5rem;
        }
        .light-mode .hero-sub { color: rgba(0,0,0,0.5); }
        .dark-mode .hero-sub { color: rgba(255,255,255,0.4); }

        .hero-ctas { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }
        .cta-primary {
          display:inline-flex; align-items:center; gap:8px;
          padding:14px 32px; border-radius:12px; border:none;
          background:linear-gradient(90deg,#d21034,#a00c28); color:#fff;
          font-family:'Sora',sans-serif; font-size:15px; font-weight:700;
          text-decoration:none; cursor:pointer;
          transition:transform .15s, box-shadow .2s;
          animation:glow 3s ease-in-out infinite;
        }
        .cta-primary:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(210,16,52,.35); }
        .cta-secondary {
          display:inline-flex; align-items:center; gap:8px;
          padding:14px 32px; border-radius:12px;
          font-family:'Sora',sans-serif; font-size:15px; font-weight:600;
          text-decoration:none; transition:all .2s, transform .15s;
        }
        .light-mode .cta-secondary {
          background: rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.12);
          color: rgba(0,0,0,0.7);
        }
        .dark-mode .cta-secondary {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.7);
        }
        .light-mode .cta-secondary:hover { background: rgba(0,0,0,0.1); color: #1a1a2e; transform:translateY(-2px); }
        .dark-mode .cta-secondary:hover { background: rgba(255,255,255,0.1); color: #fff; transform:translateY(-2px); }

        /* ── Stats strip ── */
        .stats-strip {
          position:relative; z-index:1;
          display:grid; grid-template-columns:repeat(4,1fr);
          gap:1px;
          animation:fadeUp .7s .15s ease both;
        }
        .light-mode .stats-strip {
          background: rgba(0,0,0,0.08);
          border-top: 1px solid rgba(0,0,0,0.08);
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        .dark-mode .stats-strip {
          background: rgba(255,255,255,0.06);
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        @media(max-width:560px){ .stats-strip{grid-template-columns:1fr 1fr;} }
        .stat-cell {
          padding:1.5rem 1rem; text-align:center;
          transition:background .2s;
        }
        .light-mode .stat-cell { background: #ffffff; }
        .dark-mode .stat-cell { background: #111827; }
        .light-mode .stat-cell:hover { background: rgba(0,0,0,0.02); }
        .dark-mode .stat-cell:hover { background: rgba(255,255,255,0.02); }
        .stat-num { font-family:'Sora',sans-serif; font-size:28px; font-weight:800; }
        .light-mode .stat-num { color: #1a1a2e; }
        .dark-mode .stat-num { color: #fff; }
        .stat-lbl { font-size:12px; margin-top:4px; }
        .light-mode .stat-lbl { color: rgba(0,0,0,0.5); }
        .dark-mode .stat-lbl { color: rgba(255,255,255,0.3); }

        /* ── Main card grid ── */
        .main-grid {
          position:relative; z-index:1;
          display:grid; grid-template-columns:1fr 1fr;
          gap:1px;
          max-width:980px; margin:3rem auto; border-radius:20px;
          overflow:hidden;
          animation:fadeUp .7s .25s ease both;
        }
        .light-mode .main-grid {
          background: rgba(0,0,0,0.08);
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .dark-mode .main-grid {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
        }
        @media(max-width:700px){ .main-grid{grid-template-columns:1fr; margin:2rem 1rem;} }

        .main-panel {
          padding:2rem;
        }
        .light-mode .main-panel { background: #ffffff; }
        .dark-mode .main-panel { background: #1f2937; }
        .light-mode .main-panel.right { background: #f8f9fa; }
        .dark-mode .main-panel.right { background: #1f2937; }
        .panel-title {
          font-family:'Sora',sans-serif; font-size:14px; font-weight:700;
          letter-spacing:.05em; text-transform:uppercase;
          margin-bottom:1.25rem; display:flex; align-items:center; gap:8px;
        }
        .light-mode .panel-title { color: rgba(0,0,0,0.5); }
        .dark-mode .panel-title { color: rgba(255,255,255,0.3); }
        .panel-stripe { width:20px; height:3px; border-radius:99px; }

        /* ── Auth buttons ── */
        .auth-btn {
          display:flex; align-items:center; justify-content:center; gap:10px;
          width:100%; padding:14px; border-radius:12px; border:none; cursor:pointer;
          font-family:'Sora',sans-serif; font-size:14px; font-weight:700;
          text-decoration:none; transition:transform .15s, opacity .2s;
          margin-bottom:10px;
        }
        .auth-btn:last-child { margin-bottom:0; }
        .auth-btn:hover { transform:translateY(-1px); opacity:.9; }
        .auth-btn:active { transform:scale(.98); }
        .auth-primary { background:linear-gradient(90deg,#007a33,#005a26); color:#fff; }
        .light-mode .auth-secondary {
          background: rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.1) !important;
          color: rgba(0,0,0,0.7);
        }
        .dark-mode .auth-secondary {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.08) !important;
          color: rgba(255,255,255,0.75);
        }

        /* ── Fetch election ── */
        .fetch-row { display:flex; gap:8px; margin-bottom:1rem; }
        .fetch-input {
          flex:1; padding:11px 14px; border-radius:10px;
          font-family:'DM Sans',sans-serif; font-size:13px; outline:none;
          transition:border-color .2s, box-shadow .2s;
        }
        .light-mode .fetch-input {
          background: #f8f9fa;
          border: 1px solid #e0e4e8;
          color: #1a1a2e;
        }
        .dark-mode .fetch-input {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.08);
          color: #fff;
        }
        .light-mode .fetch-input::placeholder { color: #adb5bd; }
        .dark-mode .fetch-input::placeholder { color: rgba(255,255,255,0.2); }
        .light-mode .fetch-input:focus {
          border-color: #007a33;
          box-shadow: 0 0 0 3px rgba(0,122,51,0.1);
          background: #ffffff;
        }
        .dark-mode .fetch-input:focus {
          border-color: rgba(255,255,255,0.25);
          box-shadow: 0 0 0 3px rgba(0,122,51,0.15);
        }
        .fetch-btn {
          padding:11px 18px; border-radius:10px; border:none; cursor:pointer;
          background:linear-gradient(90deg,#d21034,#a00c28); color:#fff;
          font-family:'Sora',sans-serif; font-size:13px; font-weight:700;
          white-space:nowrap; transition:opacity .2s, transform .15s;
          display:flex; align-items:center; gap:7px;
        }
        .fetch-btn:hover:not(:disabled) { opacity:.88; transform:translateY(-1px); }
        .fetch-btn:disabled { opacity:.4; cursor:not-allowed; }

        /* ── Election result card ── */
        .election-card {
          border-radius:14px; overflow:hidden; margin-top:1rem;
          animation:fadeIn .3s ease;
        }
        .light-mode .election-card {
          background: rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.08);
        }
        .dark-mode .election-card {
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .election-card-head {
          padding:10px 14px;
          display:flex; align-items:center; justify-content:space-between;
        }
        .light-mode .election-card-head { border-bottom: 1px solid rgba(0,0,0,0.06); }
        .dark-mode .election-card-head { border-bottom: 1px solid rgba(255,255,255,0.07); }
        .light-mode .election-card-head span { color: #1a1a2e; }
        .dark-mode .election-card-head span { color: #fff; }
        .live-pill {
          display:inline-flex; align-items:center; gap:5px;
          padding:3px 10px; border-radius:99px;
          background:rgba(0,122,51,.15); border:1px solid rgba(0,180,80,.25);
          font-size:11px; font-weight:700; color:#4ade80;
        }
        .election-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:12px; }
        .election-meta { border-radius:8px; padding:10px 12px; }
        .light-mode .election-meta { background: rgba(0,0,0,0.03); }
        .dark-mode .election-meta { background: rgba(0,0,0,0.2); }
        .election-meta-label { font-size:10px; text-transform:uppercase; letter-spacing:.05em; margin-bottom:3px; }
        .light-mode .election-meta-label { color: rgba(0,0,0,0.5); }
        .dark-mode .election-meta-label { color: rgba(255,255,255,0.3); }
        .election-meta-val { font-size:13px; font-weight:500; }
        .light-mode .election-meta-val { color: #1a1a2e; }
        .dark-mode .election-meta-val { color: #fff; }

        .fetch-error {
          display:flex; align-items:center; gap:7px;
          border-radius:10px; padding:9px 12px; margin-top:10px;
          font-size:12px;
        }
        .light-mode .fetch-error {
          background: rgba(220,53,69,0.08);
          border: 1px solid rgba(220,53,69,0.2);
          color: #dc3545;
        }
        .dark-mode .fetch-error {
          background: rgba(210,16,52,0.1);
          border: 1px solid rgba(210,16,52,0.25);
          color: #fc8181;
        }

        /* ── Guidelines ── */
        .guide-toggle {
          width:100%; background:none; border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:space-between; padding:0;
          font-family:'Sora',sans-serif; font-size:13px;
          font-weight:700; letter-spacing:.05em; text-transform:uppercase;
          margin-bottom:1rem;
        }
        .light-mode .guide-toggle { color: rgba(0,0,0,0.5); }
        .dark-mode .guide-toggle { color: rgba(255,255,255,0.3); }
        .guide-chevron { font-size:12px; transition:transform .25s; }
        .guide-chevron.open { transform:rotate(180deg); }
        .guide-item {
          display:flex; align-items:flex-start; gap:12px;
          padding:10px 0;
        }
        .light-mode .guide-item { border-bottom: 1px solid rgba(0,0,0,0.05); }
        .dark-mode .guide-item { border-bottom: 1px solid rgba(255,255,255,0.05); }
        .guide-item:last-child { border-bottom:none; }
        .guide-icon { font-size:16px; flex-shrink:0; margin-top:1px; }
        .guide-text { font-size:13px; line-height:1.6; }
        .light-mode .guide-text { color: rgba(0,0,0,0.6); }
        .dark-mode .guide-text { color: rgba(255,255,255,0.5); }

        /* ── Security badges ── */
        .badges { display:flex; flex-wrap:wrap; gap:8px; margin-top:1.5rem; }
        .badge {
          display:inline-flex; align-items:center; gap:5px;
          padding:5px 12px; border-radius:99px;
          font-size:11px; font-weight:600; border:1px solid;
        }
        .badge-green { background:rgba(0,122,51,.12); border-color:rgba(0,180,80,.25); color:#4ade80; }
        .badge-red   { background:rgba(210,16,52,.1);  border-color:rgba(210,16,52,.3);  color:#fc8181; }
        .badge-blue  { background:rgba(59,130,246,.1); border-color:rgba(59,130,246,.3); color:#93c5fd; }
        .light-mode .badge-dim {
          background: rgba(0,0,0,0.05);
          border-color: rgba(0,0,0,0.1);
          color: rgba(0,0,0,0.6);
        }
        .dark-mode .badge-dim {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.45);
        }

        /* ── Footer ── */
        .land-footer {
          position:relative; z-index:1;
          padding:1.5rem 1.25rem;
          display:flex; align-items:center; justify-content:space-between;
          flex-wrap:wrap; gap:10px; max-width:980px; margin:0 auto;
        }
        .light-mode .land-footer {
          border-top: 1px solid rgba(0,0,0,0.08);
        }
        .dark-mode .land-footer {
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .footer-text { font-size:12px; }
        .light-mode .footer-text { color: rgba(0,0,0,0.3); }
        .dark-mode .footer-text { color: rgba(255,255,255,0.2); }
        .footer-dots { display:flex; gap:5px; }
        .footer-dot { width:10px; height:10px; border-radius:50%; }

        /* ── Spinner ── */
        .spinner { width:14px; height:14px; border-radius:50%; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; animation:spin .7s linear infinite; }
      `}</style>

      <div className="bg-mesh" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />

      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* ── Announcement banner ── */}
      {bannerVisible && (
        <div className="ann-banner">
          <div className="ann-dot" style={{ background: URGENCY_COLOR[cur.urgency] }} />
          <div className={`ann-msg${fading ? " fading" : ""}`}>
            <span style={{ fontWeight: 600 }}>{cur.icon} {cur.title}:</span>
            <span style={{ marginLeft: 6 }}>{cur.msg}</span>
          </div>
          <Link to={cur.link}>
            <button className="ann-cta" style={{ background: URGENCY_COLOR[cur.urgency] }}>{cur.cta}</button>
          </Link>
          <div className="ann-dots">
            {BANNERS.map((_, i) => (
              <button key={i} className="ann-slide-dot"
                onClick={() => changeSlide(i)}
                style={{ width: i === slide ? 20 : 8, background: i === slide ? (isDark ? "#fff" : "#000") : (isDark ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.2)") }} />
            ))}
          </div>
          <button className="ann-close" onClick={() => setBannerVisible(false)}>×</button>
        </div>
      )}

      {/* ── Hero ── */}
      <div className="hero" style={{ opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(20px)", transition: "opacity .6s ease, transform .6s ease" }}>
        <div className="hero-flag">
          {["#000","#d21034","#007a33"].map((c) => <div key={c} className="hero-flag-bar" style={{ background: c }} />)}
        </div>
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Independent Election &amp; Boundaries Commission
        </div>
        <h1 className="hero-title">
          Your vote.<br />
          <span className="hero-title-accent">Your Kenya.</span>
        </h1>
        <p className="hero-sub">
          A secure, transparent, and verifiable digital voting platform built for every Kenyan citizen.
        </p>
        <div className="hero-ctas">
          <Link to="/register" className="cta-primary">
            <span>🗳️</span> Cast your vote
          </Link>
          <Link to="/results" className="cta-secondary">
            <span>📊</span> View live results
          </Link>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="stats-strip">
        {STATS.map(({ value, suffix, label }) => (
          <div key={label} className="stat-cell">
            <div className="stat-num"><CountUp target={value} suffix={suffix} /></div>
            <div className="stat-lbl">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Main card grid ── */}
      <div className="main-grid">

        {/* LEFT: Auth + Fetch */}
        <div className="main-panel">
          <div className="panel-title">
            <div className="panel-stripe" style={{ background: "#007a33" }} />
            Access your ballot
          </div>

          <Link to="/login" className="auth-btn auth-primary">
            <span>🔑</span> Sign in to vote
          </Link>
          <Link to="/register" className="auth-btn auth-secondary">
            <span>🪪</span> Register / Verify identity
          </Link>

          <div style={{ height: 1, background: isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)", margin: "1.5rem 0" }} />

          <div className="panel-title" style={{ marginBottom: "1rem" }}>
            <div className="panel-stripe" style={{ background: "#d21034" }} />
            Check active election
          </div>

          <div className="fetch-row">
            <input className="fetch-input" type="text" placeholder="Election ID (optional)"
              value={electionId} onChange={(e) => setElectionId(e.target.value)} />
            <button className="fetch-btn" onClick={fetchElection} disabled={loading}>
              {loading ? <><div className="spinner" /> Loading</> : <><span>🔍</span> Fetch</>}
            </button>
          </div>

          {fetchError && (
            <div className="fetch-error"><span>⚠</span>{fetchError}</div>
          )}

          {activeElection && (
            <div className="election-card">
              <div className="election-card-head">
                <span style={{ fontSize: 13, fontWeight: 600 }}>{activeElection.title}</span>
                <div className="live-pill"><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />Live</div>
              </div>
              <div className="election-grid">
                {[
                  { label: "Start date", val: activeElection.start_date },
                  { label: "End date", val: activeElection.end_date },
                  { label: "Candidates", val: activeElection.candidates_count },
                  { label: "Registered voters", val: activeElection.voters_count?.toLocaleString() ?? "—" },
                ].map(({ label, val }) => (
                  <div key={label} className="election-meta">
                    <div className="election-meta-label">{label}</div>
                    <div className="election-meta-val">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Guidelines + Badges */}
        <div className="main-panel right">
          <div className="panel-title">
            <div className="panel-stripe" style={{ background: "#3b82f6" }} />
            Voting guidelines
            <button className="guide-toggle" style={{ flex: 1, justifyContent: "flex-end" }}
              onClick={() => setGuidelinesOpen((o) => !o)}>
              <span className={`guide-chevron${guidelinesOpen ? " open" : ""}`}>▼</span>
            </button>
          </div>

          {guidelinesOpen && (
            <div style={{ animation: "fadeIn .3s ease" }}>
              {GUIDELINES.map(({ icon, text }) => (
                <div key={text} className="guide-item">
                  <span className="guide-icon">{icon}</span>
                  <span className="guide-text">{text}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ height: 1, background: isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)", margin: "1.5rem 0" }} />

          <div className="panel-title">
            <div className="panel-stripe" style={{ background: "#f59e0b" }} />
            Security &amp; trust
          </div>

          <div className="badges">
            <span className="badge badge-green">🔒 256-bit encrypted</span>
            <span className="badge badge-red">🪪 Verified voters only</span>
            <span className="badge badge-blue">🛡 End-to-end secure</span>
            <span className="badge badge-dim">⏱ Real-time results</span>
            <span className="badge badge-green">✓ Auditable records</span>
            <span className="badge badge-dim">🌍 IEBC compliant</span>
          </div>

          <div className={`mt-4 rounded-xl p-4 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`}>
            <div className={`text-xs mb-2 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Need help?</div>
            <div className={`text-sm leading-relaxed ${isDark ? 'text-white/55' : 'text-black/55'}`}>
              Contact the IEBC helpdesk at <span className="text-blue-500">0800 724 040</span> (toll-free) or email <span className="text-blue-500">support@iebc.or.ke</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="land-footer">
        <span className="footer-text">© {new Date().getFullYear()} Independent Electoral & Boundaries Commission · Kenya</span>
        <div className="footer-dots">
          {["#000","#d21034","#007a33"].map((c) => <div key={c} className="footer-dot" style={{ background: c }} />)}
        </div>
      </div>
    </div>
  );
}