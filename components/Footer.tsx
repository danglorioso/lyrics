import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-gray-900 text-center py-3 border-t border-gray-800 z-50">
      <p className="text-md text-gray-400">
        Created by{" "}
        <a
          href="https://danglorioso.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 transition-colors drop-shadow-[0_0_4px_rgba(168,85,247,0.7)]"
        >
          Dan Glorioso
        </a>
      </p>
    </footer>
  );
};

export default Footer;
