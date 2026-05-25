import type { JSX } from "react";

import type { RatingBucket, Score } from "@/types/database";

interface RatingHistogramProps {
  histogram: RatingBucket[];
  avgRating: number | null;
  ratingCount: number;
}

const SCORES: Score[] = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

function formatScore(score: number): string {
  return Number.isInteger(score) ? score.toFixed(0) : score.toFixed(1);
}

export default function RatingHistogram({
  histogram,
  avgRating,
  ratingCount,
}: RatingHistogramProps): JSX.Element {
  const buckets = SCORES.map((score) => ({
    score,
    count: histogram.find((bucket) => bucket.score === score)?.count ?? 0,
  }));
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));

  return (
    <section className="w-full max-w-[360px]" aria-label="Rating distribution">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--fg-3)]">
            Average rating
          </div>
          <div className="mt-1 text-3xl font-bold tabular-nums text-[var(--fg-1)]">
            {avgRating === null ? "No ratings" : `${avgRating.toFixed(2)} ★`}
          </div>
        </div>
        <div className="text-right text-[12px] text-[var(--fg-3)]">
          {ratingCount} {ratingCount === 1 ? "rating" : "ratings"}
        </div>
      </div>
      <div className="space-y-2">
        {buckets.map((bucket) => (
          <div
            key={bucket.score}
            className="grid grid-cols-[32px_1fr_32px] items-center gap-2"
          >
            <div className="font-mono text-[11px] text-[var(--fg-3)]">
              {formatScore(bucket.score)}
            </div>
            <div
              className="h-[6px] overflow-hidden bg-[var(--bg-3)]"
              style={{ borderRadius: "var(--r-pill, 999px)" }}
            >
              <div
                className="h-full bg-[var(--green)]"
                style={{
                  width: `${(bucket.count / maxCount) * 100}%`,
                  borderRadius: "var(--r-pill, 999px)",
                }}
              />
            </div>
            <div className="text-right text-[12px] tabular-nums text-[var(--fg-3)]">
              {bucket.count}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
