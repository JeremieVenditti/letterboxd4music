"use client";

import type { CSSProperties, JSX } from "react";

import AlbumCover from "@/components/AlbumCover";
import RatingHistogram from "@/components/RatingHistogram";
import UserRatingWidget from "@/components/UserRatingWidget";
import type { Album, Rating, RatingBucket, Review } from "@/types/database";

interface AlbumHeroProps {
  album: Album;
  histogram: RatingBucket[];
  userRating: Rating | null;
  userReview: Review | null;
  canRate: boolean;
  isAuthenticated: boolean;
}

export default function AlbumHero({
  album,
  histogram,
  userRating,
  canRate,
  isAuthenticated,
}: AlbumHeroProps): JSX.Element {
  const primaryGenre = album.genres[0] ?? null;
  const heroStyle = {
    "--album-dom": "var(--bg-2)",
    background:
      "radial-gradient(ellipse 80% 70% at 30% 30%, var(--album-dom) 0%, transparent 70%), linear-gradient(180deg, var(--album-dom) 0%, var(--bg-0) 70%)",
  } as CSSProperties;

  return (
    <section style={heroStyle} className="px-6 py-12 text-[var(--fg-1)]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[230px_minmax(0,1fr)_360px] lg:items-end">
        <AlbumCover
          src={album.cover_url}
          alt={`Album cover for ${album.title} by ${album.artist}`}
          size={230}
          priority
        />
        <div className="min-w-0">
          <div className="font-[var(--font-mono)] text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--fg-3)]">
            {album.artist}
          </div>
          <h1
            className="mt-3 max-w-4xl font-[var(--font-display)] text-5xl font-bold leading-[0.95] tracking-[-0.015em] md:text-7xl"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
          >
            {album.title}
          </h1>
          <div className="mt-6 flex flex-wrap gap-3">
            {album.release_year && (
              <span className="sticker">
                {album.release_year}
              </span>
            )}
            {primaryGenre && (
              <span className="sticker">
                {primaryGenre}
              </span>
            )}
          </div>
          {album.genres.length > 1 && (
            <div className="mt-4 text-sm text-[var(--fg-3)]">
              {album.genres.slice(1).join(" / ")}
            </div>
          )}
        </div>
        <div className="grid gap-5">
          <RatingHistogram
            histogram={histogram}
            avgRating={album.avg_rating}
            ratingCount={album.rating_count}
          />
          <UserRatingWidget
            albumId={album.id}
            initialRating={userRating}
            canRate={canRate}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
    </section>
  );
}
