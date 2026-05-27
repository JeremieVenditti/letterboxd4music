export interface MusicBrainzAlbum {
  id: string;
  title: string;
  artist: string;
  releaseYear: number | null;
  coverUrl: string | null;
  genres: string[];
}

interface MusicBrainzReleaseSearchResponse {
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

  const headers = new Headers({
    Accept: "application/json",
  });

  if (typeof window === "undefined") {
    headers.set(
      "User-Agent",
      "letterboxd4music/0.1.0 (https://letterboxd4music.local)"
    );
  }

  const requestInit: RequestInit & { next?: { revalidate: number } } = {
    headers,
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
      title: releaseGroup.title ?? release.title ?? "untitled album",
      artist: getArtist(release),
      releaseYear: getReleaseYear(
        releaseGroup["first-release-date"] ?? release.date
      ),
      coverUrl:
        release.id && release["cover-art-archive"]?.front
          ? `https://coverartarchive.org/release/${release.id}/front-250`
          : null,
      genres: getGenres(release),
    });

    if (albums.size >= 25) {
      break;
    }
  }

  return Array.from(albums.values());
}
