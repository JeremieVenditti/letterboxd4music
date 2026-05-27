"use client";

import type { FormEvent, JSX } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteReview,
  upsertReview,
} from "@/app/album/[id]/review-actions";

interface ReviewFormProps {
  albumId: string;
  canReview: boolean;
  hasRating: boolean;
  initialBody: string | null;
  onOptimisticUpdate?: (body: string | null) => void;
}

function sanitizeBody(body: string): string {
  return body.replace(/<[^>]*>/g, "").trim();
}

export default function ReviewForm({
  albumId,
  canReview,
  hasRating,
  initialBody,
  onOptimisticUpdate,
}: ReviewFormProps): JSX.Element | null {
  const router = useRouter();
  const [body, setBody] = useState(initialBody ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [hasReview, setHasReview] = useState(initialBody !== null);
  const characterCount = body.length;
  const counterColor =
    characterCount >= 1900 ? "text-[var(--danger)]" : "text-[var(--fg-4)]";

  if (!canReview) {
    return null;
  }

  if (!hasRating) {
    return (
      <div className="rounded-[4px] border border-[var(--fg-4)] bg-[var(--bg-1)] p-4">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--fg-3)]">
          YOUR REVIEW
        </div>
        <p className="mt-2 text-sm text-[var(--fg-2)]">
          You must rate this album before reviewing it.
        </p>
      </div>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const sanitizedBody = sanitizeBody(body);
    setError(null);
    setIsConfirmingDelete(false);

    if (!sanitizedBody) {
      setError("Review cannot be empty.");
      return;
    }

    if (sanitizedBody.length > 2000) {
      setError("Review must be 2,000 characters or fewer.");
      return;
    }

    const previousBody = body;
    const previousHasReview = hasReview;

    startTransition(async () => {
      setHasReview(true);
      onOptimisticUpdate?.(sanitizedBody);

      const result = await upsertReview(albumId, sanitizedBody);

      if ("error" in result) {
        setHasReview(previousHasReview);
        setBody(previousBody);
        onOptimisticUpdate?.(previousHasReview ? previousBody : null);
        setError(result.error);
        return;
      }

      setBody(result.data.body);
      onOptimisticUpdate?.(result.data.body);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }

    const previousBody = body;
    setError(null);

    startTransition(async () => {
      setHasReview(false);
      setBody("");
      onOptimisticUpdate?.(null);

      const result = await deleteReview(albumId);

      if ("error" in result) {
        setHasReview(true);
        setBody(previousBody);
        onOptimisticUpdate?.(previousBody);
        setError(result.error);
        return;
      }

      setIsConfirmingDelete(false);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={isPending ? "opacity-60" : undefined}
    >
      <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--fg-3)]">
        YOUR REVIEW
      </div>
      <textarea
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          setIsConfirmingDelete(false);
        }}
        disabled={isPending}
        maxLength={2000}
        rows={4}
        className="mt-3 min-h-[112px] w-full resize-y rounded-[4px] border border-[var(--fg-4)] bg-[var(--bg-2)] p-3 text-[15px] leading-6 text-[var(--fg-2)] shadow-none outline-none transition-colors duration-[120ms] focus-visible:border-[var(--green)] disabled:cursor-not-allowed"
      />
      <div className="mt-1 text-right">
        <span className={`font-mono text-[11px] ${counterColor}`}>
          {characterCount}/2000
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="btn-default h-9 px-3 outline-none transition-colors duration-[120ms] focus-visible:ring-2 focus-visible:ring-[var(--green)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save review
        </button>
        {hasReview && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-[13px] font-semibold text-[var(--fg-3)] outline-none transition-colors duration-[120ms] hover:text-[var(--danger)] focus-visible:ring-2 focus-visible:ring-[var(--green)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConfirmingDelete ? "Confirm delete" : "Delete review"}
          </button>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
    </form>
  );
}
