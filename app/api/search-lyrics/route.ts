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

  // helper to chunk an array
  function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  // 1) fetch songs list
  const fetchSongs = async (page = 1) => {
    const res = await fetch(
      `https://api.genius.com/artists/${artistId}/songs?per_page=20&page=${page}&sort=popularity`,
      { headers: apiHeaders }
    );
    const json = await res.json();
    return json.response.songs as Array<{ id: number; title: string; url: string }>;
  };

  // 2) scrape/embed lyrics for one song
  const searchInLyrics = async (
    title: string,
    url: string,
    songId: number
  ) => {
    console.log(`🛠️ Fetching lyrics for "${title}" via Genius API`);
    const res = await fetch(`https://api.genius.com/songs/${songId}`, {
      headers: apiHeaders,
    });
    const json = await res.json();
    const embedHtml = json.response.song.embed_content as string;

    // parse embed_content
    const $ = cheerio.load(embedHtml);
    const rawText = $('div').text();
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    // filter for keyword + before/after
    return lines
      .map((line, i) => ({ line, i }))
      .filter(({ line }) =>
        line.toLowerCase().includes(keyword.toLowerCase())
      )
      .map(({ line, i }) => {
        // find last section header above
        let section: string | null = null;
        for (let j = i; j >= 0; j--) {
          const m = lines[j].match(/^\[(.*?)\]$/);
          if (m) {
            section = m[1];
            break;
          }
        }
        const isLabel = (t: string) => /^\[.*\]$/.test(t);
        const before = i > 0 && !isLabel(lines[i - 1]) ? lines[i - 1] : null;
        const after =
          i < lines.length - 1 && !isLabel(lines[i + 1]) ? lines[i + 1] : null;

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

  // 3) iterate pages + chunked parallel fetch
  const allResults: any[] = [];
  const MAX_PAGES = 3;
  const CONCURRENCY = 5;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const songs = await fetchSongs(page);
    if (!songs.length) break;

    // chunk into batches of 5
    const batches = chunkArray(songs, CONCURRENCY);
    for (const batch of batches) {
      // fire off up to 5 at once
      const batchPromises = batch.map((song) =>
        searchInLyrics(song.title, song.url, song.id)
      );
      const batchResults = await Promise.all(batchPromises);
      // flatten and accumulate
      batchResults.forEach((r) => allResults.push(...r));
    }
  }

  return NextResponse.json({ results: allResults });
}
