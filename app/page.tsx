"use client";

import React, { useState } from "react";
import { Bs1Circle, Bs2Circle } from "react-icons/bs";
import Header from "../components/Header";
import ArtistDropdown, { OptionType } from "../components/ArtistDropdown";
import KeywordInput from "../components/KeywordInput";
import ResultCard from "../components/ResultCard";
import Footer from "../components/Footer";

interface ResultType {
  title: string;
  snippet: string;
  before?: string;
  after?: string;
  section?: string;
  songUrl: string;
}


const HomePage: React.FC = () => {
  const [selectedArtist, setSelectedArtist] = useState<OptionType | null>(null);
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<ResultType[]>([]);
  const [uniqueSongCount, setUniqueSongCount] = useState(0);

  const handleSearch = async () => {
    console.log("Search clicked!");

    if (selectedArtist && keyword) {
      try {
        const res = await fetch("/api/search-lyrics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            artistId: selectedArtist.value, // This is the Genius artist ID
            keyword,
          }),
        });
  
        const data = await res.json();
  
        if (!res.ok) {
          console.error("Error:", data.error);
          setResults([]);
          return;
        }
  
        const formattedResults = data.results.map((r: any) => ({
          title: r.songTitle,
          snippet: r.match,
          before: r.before,
          after: r.after,
          section: r.section,
          songUrl: r.songUrl,
        }));
        
        setResults(formattedResults);
        
        // Count unique songs
        const uniqueTitles = new Set(formattedResults.map((r) => r.title));
        setUniqueSongCount(uniqueTitles.size);        
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setResults([]);
      }
    } else {
      setResults([]);
    }
  };  

  return (
    <div className="bg-slate-950 min-h-screen flex flex-col items-center text-center text-white">
      <Header />

      <main className="w-full max-w-2xl px-6 space-y-10">
        {/* Step 1 */}
        <section>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Bs1Circle className="text-purple-400 text-2xl mr-1" />
            <h2 className="text-xl sm:text-2xl font-semibold">
              Select an{" "}
              <span className="text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.75)]">
                 Artist
              </span>
            </h2>
          </div>
          <ArtistDropdown
            selectedArtist={selectedArtist}
            setSelectedArtist={setSelectedArtist}
          />
        </section>

        {/* Step 2 */}
        <section>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Bs2Circle className="text-purple-400 text-2xl mr-1" />
            <h2 className="text-xl sm:text-2xl font-semibold">
               Enter a{" "}
              <span className="text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.75)]">
                Keyword
              </span>
            </h2>
          </div>
          <KeywordInput keyword={keyword} setKeyword={setKeyword} />
        </section>

        {/* Search Button */}
        <section className="flex justify-center">
          <button
            onClick={handleSearch}
            className="relative inline-flex items-center justify-center px-8 py-3 font-semibold text-white rounded-md bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600
              transition-all duration-300 transform hover:scale-105 active:scale-95
              animate-pulse-glow"
          >
            <span className="z-10">Search</span>
          </button>
        </section>


        {/* Results */}
        {results.length > 0 && (
          <section className="space-y-2">
            <h1 className="text-3xl font-semibold text-purple-300">
              Results
            </h1>

            <h2 className="text-lg font-semibold text-white mb-10">
              Found in <span className="text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]">
                {uniqueSongCount} unique song{uniqueSongCount !== 1 ? 's' : ''}
              </span>
            </h2>

            <div className="flex flex-col gap-4">
              {results.map((result, index) => (
                <ResultCard
                  key={index}
                  title={result.title}
                  snippet={result.snippet}
                  before={result.before}
                  after={result.after}
                  section={result.section}
                  songUrl={result.songUrl}
                  keyword={keyword}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
      
    </div>
  );
};

export default HomePage;
