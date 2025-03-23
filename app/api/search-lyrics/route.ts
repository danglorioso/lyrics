// app/api/search-lyrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

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

  const searchInLyrics = async (title: string, url: string, id: number) => {
    const res = await fetch(`https://genius.com/songs/${id}/lyrics`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      },
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    // Similar to previous logic
    let rawLyricsHtml = '';
    $('[data-lyrics-container]').each((_, el) => {
      const container = $(el);
      container.find('br').replaceWith('\n');
      rawLyricsHtml += container.text();
    });

    const allLines = rawLyricsHtml
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');

    console.log(`🎤 ${title} - ${allLines.length} lines scraped`);

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
          songTitle: title,
          songUrl: url,
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

  while (page <= 3) {
    const songs = await fetchSongs(page);
    if (!songs.length) break;

    for (const song of songs) {
      const matches = await searchInLyrics(song.title, song.url, song.id);
      allResults.push(...matches);
    }

    page++;
  }

  return NextResponse.json({ results: allResults });
}
