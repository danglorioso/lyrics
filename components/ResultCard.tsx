import React from "react";

interface ResultCardProps {
  title: string;
  snippet: string;
  before?: string;
  after?: string;
  section?: string;
  songUrl: string;
  keyword?: string;
}

const highlightKeyword = (text: string, keyword: string) => {
  const parts = text.split(new RegExp(`(${keyword})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <span key={i} className="text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)] font-semibold">
        {part}
      </span>
    ) : (
      part
    )
  );
};

const ResultCard: React.FC<ResultCardProps> = ({
  title,
  snippet,
  before,
  after,
  section,
  songUrl,
  keyword = "",
}) => {
  return (
    <div className="bg-gray-800 p-4 rounded-md shadow-md text-left">
      <a
        href={songUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lg font-bold text-purple-300 hover:underline"
      >
        {title}
      </a>

      {section && <p className="text-sm text-gray-400 mb-1">{section}</p>}

      <div className="text-sm text-gray-500 mb-1 italic">{before}</div>
      <div className="text-base font-medium text-white">
        {highlightKeyword(snippet, keyword)}
      </div>
      <div className="text-sm text-gray-500 mt-1 italic">{after}</div>
    </div>
  );
};

export default ResultCard;
