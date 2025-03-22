"use client";

import React, { useState } from "react";
import { Bs1Circle, Bs2Circle } from "react-icons/bs";
import Header from "../components/Header";
import ArtistDropdown, { OptionType } from "../components/ArtistDropdown";
import KeywordInput from "../components/KeywordInput";
import ResultCard from "../components/ResultCard";
import Footer from "../components/Footer";
import dynamic from 'next/dynamic';

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
  const [loading, setLoading] = useState(false);

  // Dynamically import the ArtistDropdown component to fix hydration error
  const ArtistDropdown = dynamic(() => import('../components/ArtistDropdown'), { ssr: false });

  const handleSearch = async () => {
    if (!selectedArtist || !keyword) return;
  
    setLoading(true);
    setResults([]);
    setUniqueSongCount(0);
  
    try {
      const res = await fetch("/api/search-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: selectedArtist.value,
          keyword,
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        console.error("Error:", data.error);
        return;
      }
  
      const formattedResults: ResultType[] = data.results.map((r: any) => ({
        title: r.songTitle,
        snippet: r.match,
        before: r.before,
        after: r.after,
        section: r.section,
        songUrl: r.songUrl,
      }));
  
      setResults(formattedResults);
      setUniqueSongCount(new Set(formattedResults.map(r => r.title)).size);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="bg-slate-950 min-h-screen flex flex-col items-center text-center text-white pb-16">
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
            disabled={loading}
            className={`flex items-center justify-center px-6 py-2 rounded font-medium transition-colors ${
              loading
                ? 'bg-indigo-950 text-white cursor-wait'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </section>

        {/* {loading && (
          <div className="flex items-center justify-center mt-10">
          <div className="h-6 w-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-purple-300 font-medium">Searching...</span>
        </div>
        )} */}

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
