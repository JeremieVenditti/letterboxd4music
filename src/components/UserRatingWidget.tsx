"use client";

import type { JSX } from "react";
import { useState, useTransition } from "react";
import { deleteRating, upsertRating } from "@/app/album/[id]/actions";
import { StarRating } from "@/components/StarRating";
import type { Rating, Score } from "@/types/database";

interface UserRatingWidgetProps {
  albumId: string;
  initialRating: Rating | null;
  canRate: boolean;
  isAuthenticated: boolean;
}

export default function UserRatingWidget({
  albumId,
  initialRating,
  canRate,
  isAuthenticated,
}: UserRatingWidgetProps): JSX.Element {
  const [rating, setRating] = useState<Rating | null>(initialRating);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(score: Score) {
    const previous = rating;
    setError(null);
    setRating(
      previous
        ? { ...previous, score }
        : {
            id: "pending",
            album_id: albumId,
            user_id: "pending",
            score,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
    );

    startTransition(async () => {
      const result = await upsertRating(albumId, score);

      if ("error" in result) {
        setRating(previous);
        setError(result.error);
        return;
      }

      setRating(result.data);
    });
  }

  function handleDelete() {
    const previous = rating;
    setError(null);
    setRating(null);

    startTransition(async () => {
      const result = await deleteRating(albumId);

      if ("error" in result) {
        setRating(previous);
        setError(result.error);
      }
    });
  }

  if (!canRate) {
    return (
      <div className="rounded-[4px] border border-[var(--fg-4)] bg-[var(--bg-1)] p-4">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--fg-3)]">
          Your rating
        </div>
        <p className="mt-2 text-sm text-[var(--fg-2)]">
          {isAuthenticated ? "Verify your email to rate" : "Sign in to rate"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[4px] border border-[var(--fg-4)] bg-[var(--bg-1)] p-4">
      <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--fg-3)]">
        Your rating
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <StarRating
          value={rating?.score ?? null}
          onChange={handleChange}
          size="lg"
          showValue
          disabled={isPending}
        />
        {rating && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-[12px] font-semibold text-[var(--fg-3)] outline-none transition-colors duration-[120ms] hover:text-[var(--green)] focus-visible:ring-2 focus-visible:ring-[var(--green)] disabled:opacity-60"
          >
            Delete
          </button>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
