import React from 'react';

interface KeywordInputProps {
  keyword: string;
  setKeyword: (keyword: string) => void;
}

const KeywordInput: React.FC<KeywordInputProps> = ({ keyword, setKeyword }) => {
  return (
    <input
      type="text"
      value={keyword}
      onChange={(e) => setKeyword(e.target.value)}
      placeholder="Enter keyword or phrase"
      className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
    />
  );
};

export default KeywordInput;
