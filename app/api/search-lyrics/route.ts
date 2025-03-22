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

  const searchInLyrics = async (songId: number, title: string, url: string) => {
    const res = await fetch(`https://genius.com/songs/${songId}/lyrics`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    const rawLyricsHtml = $('body').html() || '';

    const cleanedHtml = rawLyricsHtml.replace(/<br\s*\/?>/g, '\n');
    const textLyrics = cheerio.load(cleanedHtml).text();

    const allLines = textLyrics
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
      const matches = await searchInLyrics(song.id, song.title, song.url);
      allResults.push(...matches);
    }

    page++;
  }

  return NextResponse.json({ results: allResults });
}
