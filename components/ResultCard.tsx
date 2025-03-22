import React from 'react';

interface ResultCardProps {
  title: string;
  snippet: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ title, snippet }) => {
  return (
    <div className="flex items-center p-4 bg-gray-800 shadow rounded">
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-purple-300">{title}</h2>
        <p className="text-gray-400">{snippet}</p>
      </div>
    </div>
  );
};

export default ResultCard;
