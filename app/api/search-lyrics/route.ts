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

  // -------------- Swap to Mobile Lyrics --------------
  const searchInLyrics = async (
    title: string,
    url: string,
    songId: number
  ) => {
    const mobileUrl = `https://genius.com/mobile/lyrics/${songId}`;
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) ' +
      'AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
    console.log(`🛠️ Fetching (mobile) lyrics for "${title}" from ${mobileUrl}`);
    console.log(`   ↳ UA: ${ua}`);

    const res = await fetch(mobileUrl, {
      headers: { 'User-Agent': ua, Accept: 'text/html' },
    });
    console.log(`   ↳ Status: ${res.status}`);

    const html = await res.text();
    console.log(`   ↳ HTML length: ${html.length}`);

    const $ = cheerio.load(html);
    // On mobile pages, lyrics are typically plain <p> or <pre>, but we can still
    // look for the data-lyrics-container attribute if present, otherwise grab all text.
    let raw = '';
    $('[data-lyrics-container]').each((_, el) => {
      raw += $(el).text() + '\n';
    });
    if (!raw) {
      // fallback: grab everything in the body
      raw = $('body').text();
    }

    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l);

    console.log(`   ↳ Total lines parsed: ${lines.length}`);

    return lines
      .map((line, i) => ({ line, i }))
      .filter(({ line }) => line.toLowerCase().includes(keyword.toLowerCase()))
      .map(({ line, i }) => {
        const isLabel = (t: string) => /^\[.*\]$/.test(t);
        const section = ((): string | null => {
          for (let j = i; j >= 0; j--) {
            const m = lines[j].match(/^\[(.*?)\]$/);
            if (m) return m[1];
          }
          return null;
        })();
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
  // ----------------------------------------------------

  let page = 1;
  const allResults: any[] = [];

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
