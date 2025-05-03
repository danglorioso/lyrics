// app/api/search-lyrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export async function POST(req: NextRequest) {
  const { artistId, keyword } = await req.json();
  if (!artistId || !keyword) {
    return NextResponse.json(
      { error: 'Missing artistId or keyword' },
      { status: 400 }
    );
  }

  const apiHeaders = {
    Authorization: `Bearer ${process.env.GENIUS_ACCESS_TOKEN}`,
  };

  // Step 1: fetch list of songs from Genius API
  const fetchSongs = async (page = 1) => {
    const res = await fetch(
      `https://api.genius.com/artists/${artistId}/songs?per_page=20&page=${page}&sort=popularity`,
      { headers: apiHeaders }
    );
    const json = await res.json();
    return json.response.songs as Array<{ id: number; title: string; url: string }>;
  };

  // Step 2: scrape lyrics—via the proxy—to avoid 403s
  const searchInLyrics = async (
    title: string,
    url: string,
    songId: number
  ) => {
    // Try desktop URL first
    const target = `${CORS_PROXY}${encodeURIComponent(url)}`;
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

    console.log(`🛠️ Proxy-fetching lyrics for "${title}" via`, target);
    const res = await fetch(target, {
      headers: { 'User-Agent': ua, Accept: 'text/html' },
    });
    console.log(`   ↳ Status: ${res.status}`);
    const html = await res.text();
    console.log(`   ↳ HTML length: ${html.length}`);

    // Load and extract containers
    const $ = cheerio.load(html);
    let raw = '';
    $('[data-lyrics-container]').each((_, el) => {
      const c = $(el);
      c.find('br').replaceWith('\n');
      raw += c.text() + '\n';
    });

    // Fallback: if no containers, try mobile endpoint via proxy
    if (!raw) {
      const mobileUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `https://genius.com/mobile/lyrics/${songId}`
      )}`;
      console.log(`   ↳ No desktop containers—falling back to mobile via`, mobileUrl);
      const mRes = await fetch(mobileUrl, {
        headers: { 'User-Agent': ua, Accept: 'text/html' },
      });
      console.log(`     ↳ Mobile status: ${mRes.status}`);
      const mHtml = await mRes.text();
      console.log(`     ↳ Mobile HTML length: ${mHtml.length}`);
      const $$ = cheerio.load(mHtml);
      $$('[data-lyrics-container]').each((_, el) => {
        const c = $$(el);
        c.find('br').replaceWith('\n');
        raw += c.text() + '\n';
      });
      if (!raw) {
        // final fallback: grab all <p> tags from body
        raw = $$('body').text();
      }
    }

    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    console.log(`   ↳ Parsed lines: ${lines.length}`);

    // Filter & map to your result shape
    return lines
      .map((line, i) => ({ line, i }))
      .filter(({ line }) => line.toLowerCase().includes(keyword.toLowerCase()))
      .map(({ line, i }) => {
        const isLabel = (t: string) => /^\[.*\]$/.test(t);
        let section: string | null = null;
        for (let j = i; j >= 0; j--) {
          const m = lines[j].match(/^\[(.*?)\]$/);
          if (m) {
            section = m[1];
            break;
          }
        }
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

  // Step 3: iterate pages & collect matches
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
