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
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
  
    const html = await res.text();
  
    // Log raw HTML length
    console.log('📄 HTML length:', html.length);
    console.log('🔗 Song URL:', url);
  
    const $ = load(html);
    const containers = $('[data-lyrics-container]');
    console.log(`🎶 Found ${containers.length} lyric containers`);
  
    let rawLyricsHtml = '';
    containers.each((_, el) => {
      rawLyricsHtml += $(el).html(); // Get raw HTML from each container
    });
  
    const cleanedHtml = rawLyricsHtml.replace(/<br\s*\/?>/g, '\n');
    const textLyrics = load(cleanedHtml).text();
  
    const allLines = textLyrics
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');
  
    console.log('📝 First 5 lyric lines:', allLines.slice(0, 5));
  
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
