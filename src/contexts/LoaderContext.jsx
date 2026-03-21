import { createContext, useContext, useState } from "react";

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  return (
    <LoaderContext.Provider value={{ loading, showLoader, hideLoader }}>
      {children}
      {/* Fullscreen loader */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center">
          {/* Dual spinning rings */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-green-600 rounded-full animate-spin border-t-transparent"></div>
            <div className="absolute inset-0 border-4 border-red-600 rounded-full animate-spin border-b-transparent rotate-45"></div>
          </div>
        </div>
      )}
    </LoaderContext.Provider>
  );
};

// Hook to use the loader in any component
export const useLoader = () => useContext(LoaderContext);