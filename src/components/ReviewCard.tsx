import type { JSX } from "react";

import { cn } from "@/lib/utils";
import type { ReviewWithProfile } from "@/types/database";

interface ReviewCardProps {
  review: ReviewWithProfile;
  isOwn?: boolean;
}

export default function ReviewCard({
  review,
  isOwn = false,
}: ReviewCardProps): JSX.Element {
  const profile = review.profiles;
  const name = profile.display_name ?? profile.username;
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <article
      className={cn(
        "border-b border-[var(--bg-2)] py-5",
        isOwn && "border-l-2 border-l-[var(--green)] pl-4"
      )}
    >
      <div className="flex gap-3">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full bg-[var(--bg-3)] text-[12px] font-semibold text-[var(--fg-2)]">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-sans text-sm font-semibold text-[var(--indigo)]">
              {name}
            </div>
            <div className="flex items-center gap-1 text-[12px] text-[var(--fg-3)]">
              <svg
                viewBox="0 0 24 24"
                className="size-3.5 fill-[var(--heart)]"
                aria-hidden="true"
              >
                <path d="M12 21s-7.5-4.7-9.5-9.4C1 8 3.5 4.5 7 4.5c2 0 3.5 1 5 2.7 1.5-1.7 3-2.7 5-2.7 3.5 0 6 3.5 4.5 7.1C19.5 16.3 12 21 12 21z" />
              </svg>
              <span>{review.like_count}</span>
            </div>
          </div>
          <p className="mt-2 text-[15px] leading-6 text-[var(--fg-2)] [text-wrap:pretty]">
            &ldquo;{review.body}&rdquo;
          </p>
        </div>
      </div>
    </article>
  );
}
