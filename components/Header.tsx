import React from "react";

const Header: React.FC = () => {
  return (
    <header className="py-16 px-6 text-center">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-wide bg-gradient-to-r from-purple-400 via-fuchsia-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(168,85,247,0.9)] hover:drop-shadow-[0_0_24px_rgba(168,85,247,1)] transition-all duration-300 leading-tight">
            HookedOn
        </h1>

        <h2 className="mt-4 text-lg sm:text-xl text-gray-400 font-light">
            Type a word. Discover every lyric it lives in.
        </h2>
    </header>
  );
};

export default Header;
