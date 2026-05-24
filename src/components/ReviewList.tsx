import type { JSX } from "react";

import ReviewCard from "@/components/ReviewCard";
import type { ReviewWithProfile } from "@/types/database";

interface ReviewListProps {
  reviews: ReviewWithProfile[];
  currentUserId: string | null;
}

export default function ReviewList({
  reviews,
  currentUserId,
}: ReviewListProps): JSX.Element {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--fg-3)]">
        Reviews
      </div>
      {reviews.length > 0 ? (
        <div>
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isOwn={review.user_id === currentUserId}
            />
          ))}
        </div>
      ) : (
        <p className="border-b border-[var(--bg-2)] py-5 text-sm text-[var(--fg-3)]">
          No reviews yet.
        </p>
      )}
    </section>
  );
}
