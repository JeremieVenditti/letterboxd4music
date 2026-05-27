import { NextResponse } from "next/server";

import { searchAlbums } from "@/lib/musicbrainz";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (query.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    const albums = await searchAlbums(query);

    return NextResponse.json(albums);
  } catch {
    return NextResponse.json(
      { error: "Search is unavailable right now." },
      { status: 502 }
    );
  }
}
