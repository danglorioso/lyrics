// app/api/search-lyrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';

export async function POST(req: NextRequest) {
  const { artistId, keyword } = await req.json();

  if (!artistId || !keyword) {
    return NextResponse.json({ error: 'Missing artistId or keyword' }, { status: 400 });
  }

  const headers = {
    Authorization: `Bearer ${process.env.GENIUS_ACCESS_TOKEN}`,
  };

  const fetchSongs = async (page = 1) => {
    const res = await fetch(
      `https://api.genius.com/artists/${artistId}/songs?per_page=20&page=${page}&sort=popularity`,
      { headers }
    );
    const data = await res.json();
    return data.response.songs;
  };

  const searchInLyrics = async (url: string) => {
    const res = await fetch(url);
    const html = await res.text();
    const $ = load(html);
  
    let rawLyricsHtml = '';
    $('[data-lyrics-container]').each((_, el) => {
      rawLyricsHtml += $(el).html(); // Get raw HTML from each container
    });
  
    // Replace <br> tags with newline markers
    const cleanedHtml = rawLyricsHtml.replace(/<br\s*\/?>/g, '\n');
  
    // Load into cheerio again to extract all inner text while keeping structure
    const textLyrics = load(cleanedHtml).text();
  
    const allLines = textLyrics
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');
  
    const results: any[] = [];
  
    allLines.forEach((line, i) => {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        const currentSection = getSection(allLines, i);
  
        const isSectionLabel = (text: string) => /^\[.*?\]$/.test(text);
  
        const before =
          i > 0 &&
          !isSectionLabel(allLines[i - 1]) &&
          getSection(allLines, i - 1) === currentSection
            ? allLines[i - 1]
            : null;
  
        const after =
          i < allLines.length - 1 &&
          !isSectionLabel(allLines[i + 1]) &&
          getSection(allLines, i + 1) === currentSection
            ? allLines[i + 1]
            : null;
  
        results.push({
          match: line,
          before,
          after,
          index: i,
          section: currentSection,
        });
      }
    });
  
    return results;
  };
  

  const getSection = (lines: string[], index: number): string | null => {
    for (let i = index; i >= 0; i--) {
      const match = lines[i].match(/^\[(.*?)\]$/);
      if (match) return match[1];
    }
    return null;
  };
  

  let page = 1;
  let allResults: any[] = [];
  let hasMore = true;

  while (hasMore && page <= 3) { // limit pages to avoid overload
    const songs = await fetchSongs(page);

    if (songs.length === 0) break;

    for (const song of songs) {
      const matches = await searchInLyrics(song.url);
      matches.forEach(match => {
        allResults.push({
          ...match,
          songTitle: song.title,
          songUrl: song.url,
        });
      });
    }

    page++;
  }

  return NextResponse.json({ results: allResults });
}
