import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const CONCURRENCY = 4;  // songs fetched in parallel
const MAX_PAGES = 5;    // 100 songs max (20 per page)

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { artistId, keyword, maxPages = MAX_PAGES } = body;

  if (!artistId || !keyword) {
    return NextResponse.json({ error: 'Missing artistId or keyword' }, { status: 400 });
  }

  const geniusHeaders = {
    Authorization: `Bearer ${process.env.GENIUS_ACCESS_TOKEN}`,
  };

  const fetchSongs = async (page: number): Promise<any[]> => {
    const res = await fetch(
      `https://api.genius.com/artists/${artistId}/songs?per_page=20&page=${page}&sort=popularity`,
      { headers: geniusHeaders }
    );
    if (!res.ok) throw new Error(`Genius API error: ${res.status}`);
    const data = await res.json();
    return data.response?.songs ?? [];
  };

  const extractLines = (html: string): string[] => {
    const $ = cheerio.load(html);

    // Primary selector used by Genius
    let containers = $('[data-lyrics-container]');

    // Fallback selectors if primary not found
    if (!containers.length) {
      containers = $('[class*="Lyrics__Container"]');
    }
    if (!containers.length) {
      containers = $('.lyrics');
    }

    if (!containers.length) return [];

    const allLyrics: string[] = [];
    containers.each((_, el) => {
      const container = $(el);
      // Replace <br> tags with newlines before extracting text
      container.find('br').replaceWith('\n');
      // Replace block-level elements with newlines
      container.find('p, div').each((_, block) => {
        $(block).append('\n');
      });
      allLyrics.push(container.text());
    });

    return allLyrics
      .join('\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');
  };

  const getSection = (lines: string[], index: number): string | null => {
    for (let i = index; i >= 0; i--) {
      const match = lines[i].match(/^\[(.*?)\]$/);
      if (match) return match[1];
    }
    return null;
  };

  const isSectionLabel = (text: string) => /^\[.*?\]$/.test(text);

  const searchInLyrics = async (title: string, url: string): Promise<any[]> => {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });

      if (!res.ok) {
        console.warn(`Failed to fetch "${title}": HTTP ${res.status}`);
        return [];
      }

      const html = await res.text();
      const allLines = extractLines(html);

      if (!allLines.length) {
        console.warn(`No lyrics container found for "${title}"`);
        return [];
      }

      const results: any[] = [];
      allLines.forEach((line, i) => {
        if (line.toLowerCase().includes(keyword.toLowerCase())) {
          const currentSection = getSection(allLines, i);
          const before =
            i > 0 && !isSectionLabel(allLines[i - 1]) && getSection(allLines, i - 1) === currentSection
              ? allLines[i - 1]
              : null;
          const after =
            i < allLines.length - 1 && !isSectionLabel(allLines[i + 1]) && getSection(allLines, i + 1) === currentSection
              ? allLines[i + 1]
              : null;

          results.push({ match: line, before, after, index: i, section: currentSection, songTitle: title, songUrl: url });
        }
      });

      return results;
    } catch (err) {
      console.warn(`Error processing "${title}":`, err);
      return [];
    }
  };

  // Collect all songs across pages
  let allSongs: any[] = [];
  for (let page = 1; page <= maxPages; page++) {
    try {
      const songs = await fetchSongs(page);
      if (!songs.length) break;
      allSongs.push(...songs);
      if (songs.length < 20) break; // Fewer than a full page — no more pages
    } catch (err) {
      console.warn(`Failed to fetch page ${page}:`, err);
      break;
    }
  }

  if (!allSongs.length) {
    return NextResponse.json({ error: 'No songs found for this artist', results: [], songsSearched: 0 }, { status: 200 });
  }

  // Process songs in parallel batches
  const allResults: any[] = [];
  for (let i = 0; i < allSongs.length; i += CONCURRENCY) {
    const batch = allSongs.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(song => searchInLyrics(song.title, song.url)));
    allResults.push(...batchResults.flat());
  }

  return NextResponse.json({ results: allResults, songsSearched: allSongs.length });
}
