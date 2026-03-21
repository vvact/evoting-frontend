import { useEffect } from "react";

export default function LoadingOverlay({ show, text = "Loading..." }) {
  // 🔒 Lock scroll when loading
  useEffect(() => {
    document.body.style.overflow = show ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center 
      bg-black/60 backdrop-blur-sm animate-fade-in">

      <div className="flex flex-col items-center gap-6">

        {/* 🔄 Dual Kenyan Spinner */}
        <div className="relative w-16 h-16 flex items-center justify-center">

          {/* Outer Ring */}
          <div className="absolute w-16 h-16 rounded-full 
            bg-kenya-flag p-[3px] animate-spin 
            shadow-[0_0_25px_rgba(255,0,0,0.4)]">
            <div className="w-full h-full bg-black rounded-full"></div>
          </div>

          {/* Inner Ring (reverse spin) */}
          <div className="absolute w-10 h-10 rounded-full 
            bg-kenya-flag p-[2px] 
            animate-[spin_1.5s_linear_reverse_infinite]">
            <div className="w-full h-full bg-black rounded-full"></div>
          </div>

        </div>

        {/* Text */}
        <p className="text-white text-sm font-semibold tracking-wide animate-pulse">
          {text}
        </p>

      </div>

    </div>
  );
}