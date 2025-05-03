// app/api/search-lyrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: NextRequest) {
  const { artistId, keyword } = await req.json();

  if (!artistId || !keyword) {
    return NextResponse.json(
      { error: 'Missing artistId or keyword' },
      { status: 400 }
    );
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

  const searchInLyrics = async (title: string, url: string) => {
    // Build a realistic browser header
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
    const fetchHeaders = {
      'User-Agent': userAgent,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    };

    console.log(`🛠️ Fetching lyrics for "${title}" from ${url}`);
    console.log('   ↳ Using headers:', fetchHeaders);

    const res = await fetch(url, { headers: fetchHeaders });
    console.log(`   ↳ Status: ${res.status}`);

    const html = await res.text();
    console.log(`   ↳ HTML length: ${html.length}`);
    console.log(
      '   ↳ HTML snippet:',
      html.slice(0, 200).replace(/\n/g, ' '),
      '…'
    );

    const $ = cheerio.load(html);
    const containers = $('[data-lyrics-container]');
    console.log(`   ↳ Containers found: ${containers.length}`);

    let allLyrics: string[] = [];
    containers.each((_, el) => {
      const container = $(el);
      container.find('br').replaceWith('\n');
      allLyrics.push(container.text());
    });

    const allLines = allLyrics
      .join('\n')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '');

    console.log(`   ↳ Total lines parsed: ${allLines.length}`);

    // filter and map matches
    return allLines
      .map((line, i) => ({ line, i }))
      .filter(({ line }) =>
        line.toLowerCase().includes(keyword.toLowerCase())
      )
      .map(({ line, i }) => ({
        match: line,
        before:
          i > 0 && !/^\[.*\]$/.test(allLines[i - 1])
            ? allLines[i - 1]
            : null,
        after:
          i < allLines.length - 1 && !/^\[.*\]$/.test(allLines[i + 1])
            ? allLines[i + 1]
            : null,
        index: i,
        section: getSection(allLines, i),
        songTitle: title,
        songUrl: url,
      }));
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
      const matches = await searchInLyrics(song.title, song.url);
      allResults.push(...matches);
    }

    page++;
  }

  return NextResponse.json({ results: allResults });
}
