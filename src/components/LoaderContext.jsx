import { createContext, useState, useContext } from "react";

const LoaderContext = createContext();

export function LoaderProvider({ children }) {
  const [loadingCount, setLoadingCount] = useState(0);

  const showLoader = () => setLoadingCount((c) => c + 1);
  const hideLoader = () => setLoadingCount((c) => Math.max(c - 1, 0));

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {children}
      {loadingCount > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6">

            {/* 🇰🇪 Dual Kenyan spinner */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute w-16 h-16 rounded-full bg-kenya-flag p-[3px] animate-spin shadow-[0_0_25px_rgba(255,0,0,0.4)]">
                <div className="w-full h-full bg-black rounded-full"></div>
              </div>
              <div className="absolute w-10 h-10 rounded-full bg-kenya-flag p-[2px] animate-[spin_1.5s_linear_reverse_infinite]">
                <div className="w-full h-full bg-black rounded-full"></div>
              </div>
            </div>

            <p className="text-white text-sm font-semibold tracking-wide animate-pulse">
              Loading...
            </p>
          </div>
        </div>
      )}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  return useContext(LoaderContext);
}