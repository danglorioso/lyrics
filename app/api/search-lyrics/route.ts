// app/api/search-lyrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: NextRequest) {
  const { artistId, keyword } = await req.json();
  if (!artistId || !keyword) {
    return NextResponse.json({ error: 'Missing artistId or keyword' }, { status: 400 });
  }

  const API_TOKEN = process.env.GENIUS_ACCESS_TOKEN!;
  const apiHeaders = {
    Authorization: `Bearer ${API_TOKEN}`,
    Accept: 'application/json',
  };

  // 1) Fetch list of songs
  const fetchSongs = async (page = 1) => {
    const res = await fetch(
      `https://api.genius.com/artists/${artistId}/songs?per_page=20&page=${page}&sort=popularity`,
      { headers: apiHeaders }
    );
    const json = await res.json();
    return json.response.songs as Array<{ id: number; title: string; url: string }>;
  };

  // 2) Fetch embed_content from /songs/:id
  const searchInLyrics = async (
    title: string,
    url: string,
    songId: number
  ) => {
    console.log(`🛠️ Fetching lyrics for "${title}" via Genius API`);
    const res = await fetch(`https://api.genius.com/songs/${songId}`, {
      headers: apiHeaders,
    });
    console.log(`   ↳ API status: ${res.status}`);
    const json = await res.json();
    const embedHtml = json.response.song.embed_content as string;
    console.log(`   ↳ embed_content length: ${embedHtml.length}`);

    // parse the embed HTML
    const $ = cheerio.load(embedHtml);
    // all lyric lines are inside that div
    const rawText = $('div').text();
    const allLines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    console.log(`   ↳ Parsed lines: ${allLines.length}`);

    // filter for your keyword and grab before/after
    return allLines
      .map((line, i) => ({ line, i }))
      .filter(({ line }) =>
        line.toLowerCase().includes(keyword.toLowerCase())
      )
      .map(({ line, i }) => {
        // find section header
        let section: string | null = null;
        for (let j = i; j >= 0; j--) {
          const m = allLines[j].match(/^\[(.*?)\]$/);
          if (m) {
            section = m[1];
            break;
          }
        }
        const isLabel = (t: string) => /^\[.*\]$/.test(t);
        const before = i > 0 && !isLabel(allLines[i - 1]) ? allLines[i - 1] : null;
        const after =
          i < allLines.length - 1 && !isLabel(allLines[i + 1])
            ? allLines[i + 1]
            : null;

        return {
          match: line,
          before,
          after,
          index: i,
          section,
          songTitle: title,
          songUrl: url,
        };
      });
  };

  // 3) Loop through pages & collect matches
  let page = 1;
  const allResults: any[] = [];
  while (page <= 3) {
    const songs = await fetchSongs(page);
    if (songs.length === 0) break;
    for (const song of songs) {
      const matches = await searchInLyrics(song.title, song.url, song.id);
      allResults.push(...matches);
    }
    page++;
  }

  return NextResponse.json({ results: allResults });
}
