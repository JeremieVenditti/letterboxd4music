import { NextResponse } from "next/server";

import type { MusicBrainzAlbum } from "@/lib/musicbrainz";
import { cacheAlbumFromMusicBrainz } from "@/lib/musicbrainz";

export interface CacheAlbumRequest {
  album: MusicBrainzAlbum;
}

export interface CacheAlbumResponse {
  id: string;
}

function isCacheAlbumRequest(value: unknown): value is CacheAlbumRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const album = (value as { album?: unknown }).album;

  if (!album || typeof album !== "object") {
    return false;
  }

  const candidate = album as Partial<MusicBrainzAlbum>;

  return (
    typeof candidate.musicbrainzId === "string" &&
    candidate.musicbrainzId.trim().length > 0 &&
    typeof candidate.title === "string" &&
    candidate.title.trim().length > 0 &&
    typeof candidate.artist === "string" &&
    candidate.artist.trim().length > 0
  );
}

export async function POST(
  request: Request
): Promise<NextResponse<CacheAlbumResponse | { error: string }>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isCacheAlbumRequest(body)) {
    return NextResponse.json({ error: "Invalid album." }, { status: 400 });
  }

  try {
    const album = await cacheAlbumFromMusicBrainz(body.album);

    return NextResponse.json({ id: album.id });
  } catch {
    return NextResponse.json(
      { error: "Album cache failed." },
      { status: 502 }
    );
  }
}
