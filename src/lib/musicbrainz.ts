export interface MusicBrainzAlbum {
  id: string;
  musicbrainzId: string;
  title: string;
  artist: string;
  releaseYear: number | null;
  coverUrl: string | null;
  genres: string[];
}

export interface CachedAlbumResult {
  id: string;
  musicbrainz_id: string;
  title: string;
  artist: string;
  release_year: number | null;
  cover_url: string | null;
  genres: string[];
}

interface MusicBrainzReleaseSearchResponse {
  releases?: MusicBrainzRelease[];
}

interface MusicBrainzReleaseGroupResponse {
  id?: string;
  title?: string;
  "first-release-date"?: string;
  "artist-credit"?: MusicBrainzRelease["artist-credit"];
  tags?: Array<{
    name?: string;
  }>;
  genres?: Array<{
    name?: string;
  }>;
  releases?: MusicBrainzRelease[];
}

interface MusicBrainzRelease {
  id?: string;
  title?: string;
  date?: string;
  "artist-credit"?: Array<{
    name?: string;
    artist?: {
      name?: string;
    };
  }>;
  "release-group"?: {
    id?: string;
    title?: string;
    "first-release-date"?: string;
    tags?: Array<{
      name?: string;
    }>;
    genres?: Array<{
      name?: string;
    }>;
  };
  "cover-art-archive"?: {
    front?: boolean;
  };
}

function getReleaseYear(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const year = Number.parseInt(value.slice(0, 4), 10);

  return Number.isNaN(year) ? null : year;
}

function getArtist(release: MusicBrainzRelease): string {
  const credits = release["artist-credit"] ?? [];
  const names = credits
    .map((credit) => credit.name ?? credit.artist?.name)
    .filter((name): name is string => Boolean(name));

  return names.join("") || "unknown artist";
}

function getGenres(release: MusicBrainzRelease): string[] {
  const source =
    release["release-group"]?.genres ?? release["release-group"]?.tags ?? [];

  return source
    .map((genre) => genre.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 3);
}

function getMusicBrainzHeaders(): Headers {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (typeof window === "undefined") {
    headers.set(
      "User-Agent",
      "letterboxd4music/0.1.0 (https://letterboxd4music.local)"
    );
  }

  return headers;
}

async function isUsableCoverUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });

    return response.ok;
  } catch {
    return false;
  }
}

async function getCoverUrl(
  releaseGroupId: string,
  releaseId: string | undefined,
  hasReleaseFrontCover: boolean | undefined
): Promise<string | null> {
  const releaseGroupCoverUrl = `https://coverartarchive.org/release-group/${releaseGroupId}/front-250`;

  if (await isUsableCoverUrl(releaseGroupCoverUrl)) {
    return releaseGroupCoverUrl;
  }

  if (releaseId && hasReleaseFrontCover) {
    return `https://coverartarchive.org/release/${releaseId}/front-250`;
  }

  return null;
}

export async function searchAlbums(
  query: string
): Promise<MusicBrainzAlbum[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    query: trimmedQuery,
    fmt: "json",
    limit: "25",
    inc: "artist-credits+release-groups+tags",
  });

  const requestInit: RequestInit & { next?: { revalidate: number } } = {
    headers: getMusicBrainzHeaders(),
  };

  if (typeof window === "undefined") {
    requestInit.next = { revalidate: 0 };
  }

  const response = await fetch(
    `https://musicbrainz.org/ws/2/release?${params.toString()}`,
    requestInit
  );

  if (!response.ok) {
    throw new Error("MusicBrainz search failed.");
  }

  const data = (await response.json()) as MusicBrainzReleaseSearchResponse;
  const albums = new Map<string, MusicBrainzAlbum>();

  for (const release of data.releases ?? []) {
    const releaseGroup = release["release-group"];
    const releaseGroupId = releaseGroup?.id;

    if (!releaseGroupId || albums.has(releaseGroupId)) {
      continue;
    }

    albums.set(releaseGroupId, {
      id: releaseGroupId,
      musicbrainzId: releaseGroupId,
      title: releaseGroup.title ?? release.title ?? "untitled album",
      artist: getArtist(release),
      releaseYear: getReleaseYear(
        releaseGroup["first-release-date"] ?? release.date
      ),
      coverUrl: await getCoverUrl(
        releaseGroupId,
        release.id,
        release["cover-art-archive"]?.front
      ),
      genres: getGenres(release),
    });

    if (albums.size >= 25) {
      break;
    }
  }

  return Array.from(albums.values());
}

async function getAlbumFromMusicBrainzReleaseGroup(
  musicbrainzId: string
): Promise<MusicBrainzAlbum | null> {
  const params = new URLSearchParams({
    fmt: "json",
    inc: "artist-credits+tags+genres+releases",
  });
  const requestInit: RequestInit & { next?: { revalidate: number } } = {
    headers: getMusicBrainzHeaders(),
  };

  if (typeof window === "undefined") {
    requestInit.next = { revalidate: 0 };
  }

  const response = await fetch(
    `https://musicbrainz.org/ws/2/release-group/${musicbrainzId}?${params.toString()}`,
    requestInit
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("MusicBrainz album lookup failed.");
  }

  const releaseGroup =
    (await response.json()) as MusicBrainzReleaseGroupResponse;
  const releaseWithCover = releaseGroup.releases?.find(
    (release) => release.id && release["cover-art-archive"]?.front
  );
  const release = releaseWithCover ?? releaseGroup.releases?.[0];

  if (!releaseGroup.id) {
    return null;
  }

  return {
    id: releaseGroup.id,
    musicbrainzId: releaseGroup.id,
    title: releaseGroup.title ?? release?.title ?? "untitled album",
    artist: getArtist({ "artist-credit": releaseGroup["artist-credit"] }),
    releaseYear: getReleaseYear(
      releaseGroup["first-release-date"] ?? release?.date
    ),
    coverUrl: await getCoverUrl(
      releaseGroup.id,
      releaseWithCover?.id,
      releaseWithCover?.["cover-art-archive"]?.front
    ),
    genres: (releaseGroup.genres ?? releaseGroup.tags ?? [])
      .map((genre) => genre.name)
      .filter((name): name is string => Boolean(name))
      .slice(0, 3),
  };
}

export async function cacheAlbumFromMusicBrainz(
  album: MusicBrainzAlbum
): Promise<CachedAlbumResult> {
  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();
  const musicbrainzId = album.musicbrainzId;

  const { data: existingAlbum, error: existingAlbumError } = await supabase
    .from("albums")
    .select("id, musicbrainz_id, title, artist, release_year, cover_url, genres")
    .eq("musicbrainz_id", musicbrainzId)
    .maybeSingle<CachedAlbumResult>();

  if (existingAlbumError) {
    throw new Error("Album lookup failed.");
  }

  if (existingAlbum && (existingAlbum.cover_url || !album.coverUrl)) {
    return existingAlbum;
  }

  const { data: cachedAlbum, error: cacheError } = await supabase
    .rpc("cache_musicbrainz_album", {
      p_musicbrainz_id: musicbrainzId,
      p_title: album.title,
      p_artist: album.artist,
      p_release_year: album.releaseYear,
      p_cover_url: album.coverUrl,
      p_genres: album.genres,
    })
    .maybeSingle<CachedAlbumResult>();

  if (cacheError || !cachedAlbum) {
    throw new Error("Album cache failed.");
  }

  return cachedAlbum;
}

export async function getOrCacheAlbumByMusicBrainzId(
  musicbrainzId: string
): Promise<CachedAlbumResult | null> {
  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();

  const { data: album, error } = await supabase
    .from("albums")
    .select("id, musicbrainz_id, title, artist, release_year, cover_url, genres")
    .eq("musicbrainz_id", musicbrainzId)
    .maybeSingle<CachedAlbumResult>();

  if (error) {
    throw new Error("Album lookup failed.");
  }

  if (album) {
    return album;
  }

  const musicBrainzAlbum = await getAlbumFromMusicBrainzReleaseGroup(
    musicbrainzId
  );

  if (!musicBrainzAlbum) {
    return null;
  }

  return cacheAlbumFromMusicBrainz(musicBrainzAlbum);
}
