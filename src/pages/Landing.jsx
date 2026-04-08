import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../api";

export default function Landing() {
  const { call } = useApi();
  const [activeElection, setActiveElection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [guidelinesOpen, setGuidelinesOpen] = useState(true);
  
  // Rotating banner state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const bannerMessages = [
    {
      title: "🗳️ Voter registration is open",
      message: "Deadline: July 20, 2025 — make sure your details are up to date.",
      ctaText: "Register now",
      ctaLink: "/register",
      urgency: "high"
    },
    {
      title: "📢 Poll worker applications",
      message: "We're hiring election officials. Training provided. Apply by June 15.",
      ctaText: "Apply here",
      ctaLink: "/volunteer",
      urgency: "medium"
    },
    {
      title: "✅ Early voting now available",
      message: "Skip the lines — vote early at any county election office.",
      ctaText: "Find locations",
      ctaLink: "/early-voting",
      urgency: "medium"
    },
    {
      title: "🔐 Security update",
      message: "Two-factor authentication is now required for all voters.",
      ctaText: "Set up 2FA",
      ctaLink: "/security",
      urgency: "low"
    }
  ];

  // ✅ FETCH ELECTION FUNCTION (was missing)
  const fetchElection = async () => {
    setLoading(true);
    try {
      const res = await call({
        url: "/elections/active/",
        method: "GET",
      });
      setActiveElection(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (!showBanner) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [currentSlide, showBanner]);

  const nextSlide = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerMessages.length);
      setIsTransitioning(false);
    }, 300);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + bannerMessages.length) % bannerMessages.length);
      setIsTransitioning(false);
    }, 300);
  };

  const goToSlide = (index) => {
    if (index === currentSlide) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
    }, 300);
  };

  const dismissBanner = () => {
    setBannerVisible(false);
    setTimeout(() => setShowBanner(false), 400);
  };

  const current = bannerMessages[currentSlide];
  
  const urgencyColors = {
    high: "bg-red-600 hover:bg-red-700",
    medium: "bg-blue-600 hover:bg-blue-700",
    low: "bg-gray-700 hover:bg-gray-800"
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ── Rotating Banner CTA ── */}
      {showBanner && (
        <div
          className={`w-full bg-gray-900 text-white flex flex-col items-center justify-between px-4 sm:px-6 py-2.5 gap-3 transition-all duration-400 ${
            bannerVisible ? "opacity-100 max-h-40 sm:max-h-24" : "opacity-0 max-h-0 overflow-hidden py-0"
          }`}
        >
          <div className="w-full max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Slide content with fade animation */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto min-w-0 flex-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              <div className={`transition-all duration-300 ${isTransitioning ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}`}>
                <p className="text-xs sm:text-sm text-gray-200">
                  <span className="font-semibold text-white">{current.title}</span>
                  {" "}{current.message}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-shrink-0">
              <Link
                to={current.ctaLink}
                className={`text-xs font-semibold ${urgencyColors[current.urgency]} text-white px-3 sm:px-4 py-1.5 rounded-md transition-all active:scale-95 whitespace-nowrap`}
              >
                {current.ctaText}
              </Link>
              <button
                onClick={dismissBanner}
                className="text-gray-400 hover:text-white transition-colors text-lg leading-none flex-shrink-0"
                aria-label="Dismiss"
              >
                &times;
              </button>
            </div>
          </div>
          
          {/* Navigation dots */}
          <div className="flex gap-1.5 pb-1">
            {bannerMessages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`h-1 rounded-full transition-all duration-200 ${
                  idx === currentSlide 
                    ? "w-6 bg-green-500" 
                    : "w-3 bg-gray-600 hover:bg-gray-500"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white rounded-2xl border border-gray-200 overflow-hidden mx-2 sm:mx-4">

          {/* Flag bar */}
          <div className="flex h-1">
            <div className="flex-1 bg-green-700" />
            <div className="flex-1 bg-gray-900" />
            <div className="flex-1 bg-red-700" />
          </div>

          <div className="p-4 sm:p-6 md:p-8">

            {/* Header */}
            <div className="text-center mb-5 sm:mb-7">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg width="22" height="22" viewBox="0 0 26 26" fill="none" className="sm:w-[26px] sm:h-[26px]">
                  <path d="M13 1.5L3 5.5v8c0 5.2 4 10 10 11.5 6-1.5 10-6.3 10-11.5v-8L13 1.5z"
                    fill="#15803d" fillOpacity="0.12" stroke="#15803d" strokeWidth="1.4" />
                  <path d="M9 13l3 3 5-5" stroke="#15803d" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">
                  Secure E-Voting Platform
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Powered by the Independent Election Authority
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <Link
                to="/login"
                className="bg-green-700 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-green-800 active:scale-95 transition-all text-center"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-white text-gray-900 text-sm font-medium py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 active:scale-95 transition-all text-center"
              >
                Verify identity
              </Link>
            </div>

            {/* Fetch Election */}
            <div className="flex flex-col sm:flex-row gap-2 mb-5">
              <input
                type="text"
                placeholder="Election ID (optional)"
                className="flex-1 text-sm px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-all"
              />
              <button
                onClick={fetchElection}
                disabled={loading}
                className="px-4 py-2.5 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Loading
                  </>
                ) : (
                  "Fetch election"
                )}
              </button>
            </div>

            {/* Election Result Card */}
            {activeElection && (
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-5">
                <div className="bg-gray-50 px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Active election
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-sm sm:text-base font-semibold text-gray-900 mb-3">
                    {activeElection.title}
                  </p>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Start date</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{activeElection.start_date}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-0.5">End date</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{activeElection.end_date}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Candidates</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{activeElection.candidates_count}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Registered voters</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{activeElection.voters_count ?? "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Voting Guidelines */}
            <div className="border border-gray-200 rounded-xl overflow-hidden mb-5">
              <button
                onClick={() => setGuidelinesOpen(!guidelinesOpen)}
                className="w-full bg-gray-50 px-4 py-2.5 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-600">Voting guidelines</span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${guidelinesOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 16 16" fill="none"
                >
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {guidelinesOpen && (
                <div className="divide-y divide-gray-100">
                  {[
                    "Each registered voter can vote only once per election.",
                    "Identity verification is required before voting.",
                    "Votes are securely recorded and cannot be modified.",
                    "All results are transparently counted and auditable.",
                  ].map((rule, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3">
                      <div className="w-5 h-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2.5 5l2 2L7.5 3" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{rule}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Security Badges */}
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              <span className="flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-800 border border-green-200 px-2 sm:px-3 py-1.5 rounded-full">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="flex-shrink-0">
                  <path d="M5.5 1L1.5 2.8v4c0 2.5 1.8 4.8 4 5.2 2.2-.4 4-2.7 4-5.2v-4L5.5 1z"
                    fill="#15803d" fillOpacity="0.15" stroke="#15803d" strokeWidth="1" />
                </svg>
                Encrypted voting
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium bg-gray-900 text-gray-100 px-2 sm:px-3 py-1.5 rounded-full">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="flex-shrink-0">
                  <rect x="2" y="5" width="7" height="5" rx="1" stroke="#e5e7eb" strokeWidth="1" />
                  <path d="M3.5 5V3.5a2 2 0 014 0V5" stroke="#e5e7eb" strokeWidth="1" strokeLinecap="round" />
                </svg>
                Secure auth
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-800 border border-red-200 px-2 sm:px-3 py-1.5 rounded-full">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="flex-shrink-0">
                  <circle cx="5.5" cy="5.5" r="4" stroke="#991b1b" strokeWidth="1" />
                  <path d="M3.5 5.5l1.5 1.5L7.5 4" stroke="#991b1b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Verified voters only
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-700 px-2 sm:px-3 py-1.5 rounded-full">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="flex-shrink-0">
                  <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1" />
                  <path d="M5.5 3.5v2l1.5 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
                Transparent process
              </span>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center sm:text-left">
                &copy; {new Date().getFullYear()} Election Authority
              </p>
              <div className="flex gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-green-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                <span className="w-2.5 h-2.5 rounded-full bg-red-700" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}