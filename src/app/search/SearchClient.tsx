"use client";

import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import AlbumCard from "@/components/AlbumCard";
import type { MusicBrainzAlbum } from "@/lib/musicbrainz";

interface SearchClientProps {
  initialQuery: string;
  initialResults: MusicBrainzAlbum[];
}

export default function SearchClient({
  initialQuery,
  initialResults,
}: SearchClientProps): JSX.Element {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(initialResults);
  const [resultsQuery, setResultsQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const trimmedQuery = query.trim();
    let isCurrent = true;
    const timeout = window.setTimeout(() => {
      const href =
        trimmedQuery.length > 0
          ? `/search?q=${encodeURIComponent(trimmedQuery)}`
          : "/search";

      router.replace(href, { scroll: false });

      if (trimmedQuery.length < 2) {
        setResults([]);
        setResultsQuery("");
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      void fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Search failed.");
          }

          return response.json() as Promise<MusicBrainzAlbum[]>;
        })
        .then((albums) => {
          if (isCurrent) {
            setResults(albums);
            setResultsQuery(trimmedQuery);
          }
        })
        .catch(() => {
          if (isCurrent) {
            setError("search is unavailable right now. try again in a moment");
            setResults([]);
          }
        })
        .finally(() => {
          if (isCurrent) {
            setIsLoading(false);
          }
        });
    }, 350);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeout);
    };
  }, [query, router]);

  const trimmedQuery = query.trim();

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[var(--bg-0)] px-4 py-8 text-[var(--fg-1)] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1280px] gap-8">
        <div className="grid gap-3">
          <label
            htmlFor="album-search"
            className="text-[14px] font-semibold text-[var(--fg-2)]"
          >
            search albums
          </label>
          <input
            id="album-search"
            type="search"
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);

              if (nextQuery.trim().length < 2) {
                setResults([]);
                setResultsQuery("");
                setError(null);
                setIsLoading(false);
              }
            }}
            autoFocus
            className="h-12 w-full rounded-[4px] border border-[var(--fg-4)] bg-[var(--bg-2)] px-4 text-[16px] text-[var(--fg-1)] outline-none transition duration-[120ms] placeholder:text-[var(--fg-3)] focus:border-[var(--green)] focus:ring-2 focus:ring-[var(--green)]"
            placeholder="album, artist, or release"
          />
        </div>

        {isLoading ? <SkeletonGrid /> : null}

        {!isLoading && error ? (
          <p className="text-[14px] text-[var(--fg-3)]">{error}</p>
        ) : null}

        {!isLoading && !error && trimmedQuery.length < 2 ? (
          <p className="text-[14px] text-[var(--fg-3)]">
            search for an album or artist
          </p>
        ) : null}

        {!isLoading &&
        !error &&
        trimmedQuery.length >= 2 &&
        results.length === 0 ? (
          <p className="text-[14px] text-[var(--fg-3)]">
            no albums found for &quot;{trimmedQuery}&quot; — try a different
            spelling or artist name
          </p>
        ) : null}

        {!isLoading && !error && trimmedQuery.length >= 2 && results.length > 0 ? (
          <section className="grid gap-4" aria-label="album search results">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--fg-3)]">
              RESULTS FOR &quot;{resultsQuery}&quot;
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {results.map((album) => (
                <AlbumCard key={album.id} album={album} size="md" />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function SkeletonGrid(): JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-[4px] bg-[var(--bg-2)] p-2"
        >
          <div className="aspect-square animate-pulse rounded-[4px] bg-[var(--bg-3)]" />
          <div className="h-4 animate-pulse rounded-[4px] bg-[var(--bg-3)]" />
          <div className="h-3 w-3/4 animate-pulse rounded-[4px] bg-[var(--bg-3)]" />
        </div>
      ))}
    </div>
  );
}
