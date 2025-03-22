import React from "react";

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900 py-16 px-6 text-center">
      <h1 className="text-5xl sm:text-6xl font-extrabold tracking-wide bg-gradient-to-r from-purple-400 via-fuchsia-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(168,85,247,0.8)] hover:drop-shadow-[0_0_20px_rgba(168,85,247,1)] transition-all duration-300 leading-tight">
        Lyrics Finder
      </h1>

      <h2 className="mt-4 text-lg sm:text-xl text-gray-400 font-light">
        Search keywords from your favorite artist's lyrics
      </h2>
    </header>
  );
};

export default Header;
