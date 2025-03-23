// app/api/search-genius/route.ts

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log("🧪 GENIUS_ACCESS_TOKEN:", !!process.env.GENIUS_ACCESS_TOKEN);
  
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 3) {
    return NextResponse.json({ error: 'Search term must be at least 3 characters' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${process.env.GENIUS_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch from Genius API' }, { status: response.status });
    }
 
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
