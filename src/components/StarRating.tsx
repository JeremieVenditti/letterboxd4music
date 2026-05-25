"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import type { Score } from "@/types/database"

export interface StarRatingProps {
  value: Score | null
  onChange?: (value: Score) => void
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  disabled?: boolean
}

const sizeClasses = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
}

const cellSizeClasses = {
  sm: "size-5",
  md: "size-6",
  lg: "size-8",
}

function clampRating(value: number) {
  return Math.min(5, Math.max(0.5, Math.round(value * 2) / 2))
}

function formatRating(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function wrapRating(value: number) {
  return clampRating(value)
}

function StarIcon({
  fill,
  className,
}: {
  fill: "empty" | "half" | "full"
  className?: string
}) {
  return (
    <span className={cn("relative inline-block", className)} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 size-full fill-[var(--bg-3)] stroke-[var(--fg-4)]"
      >
        <path d="M12 2.25 15.09 8.5l6.91 1-5 4.88 1.18 6.88L12 18.01l-6.18 3.25L7 14.38 2 9.5l6.91-1L12 2.25Z" />
      </svg>
      <span
        className={cn(
          "absolute inset-0 overflow-hidden",
          fill === "empty" && "w-0",
          fill === "half" && "w-1/2",
          fill === "full" && "w-full"
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-full fill-[var(--green)] stroke-[var(--green)]"
        >
          <path d="M12 2.25 15.09 8.5l6.91 1-5 4.88 1.18 6.88L12 18.01l-6.18 3.25L7 14.38 2 9.5l6.91-1L12 2.25Z" />
        </svg>
      </span>
      <svg viewBox="0 0 24 24" className="invisible size-full">
        <path d="M12 2.25 15.09 8.5l6.91 1-5 4.88 1.18 6.88L12 18.01l-6.18 3.25L7 14.38 2 9.5l6.91-1L12 2.25Z" />
      </svg>
    </span>
  )
}

export function StarRating({
  value,
  onChange,
  size = "md",
  showValue = false,
  disabled = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null)
  const radioRefs = React.useRef<Array<HTMLButtonElement | null>>([])
  const pendingFocusValue = React.useRef<number | null>(null)
  const currentValue = value === null ? null : clampRating(value)
  const interactive = Boolean(onChange) && !disabled
  const displayValue = hoverValue ?? currentValue

  function focusRating(rating: number) {
    radioRefs.current[Math.round(rating * 2) - 1]?.focus()
  }

  React.useEffect(() => {
    if (
      pendingFocusValue.current === null ||
      currentValue !== pendingFocusValue.current
    ) {
      return
    }

    focusRating(pendingFocusValue.current)
    pendingFocusValue.current = null
  }, [currentValue])

  function handlePointerMove(rating: number) {
    if (!interactive) {
      return
    }

    setHoverValue(rating)
  }

  function handleClick(rating: number) {
    if (!interactive || !onChange) {
      return
    }

    onChange(rating as Score)
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    rating: number
  ) {
    if (!interactive || !onChange) {
      return
    }

    if (
      event.key !== "ArrowRight" &&
      event.key !== "ArrowUp" &&
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowDown"
    ) {
      return
    }

    event.preventDefault()

    const direction =
      event.key === "ArrowRight" || event.key === "ArrowUp" ? 0.5 : -0.5
    const nextValue = wrapRating(rating + direction)
    pendingFocusValue.current = nextValue
    onChange(nextValue as Score)
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div
        role="radiogroup"
        aria-label="Rating"
        className={cn("inline-flex items-center", !interactive && "pointer-events-none")}
        onMouseLeave={() => setHoverValue(null)}
      >
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1
          const fill =
            displayValue === null || displayValue <= index
              ? "empty"
              : displayValue >= starValue
                ? "full"
                : "half"
          const halfValues = [index + 0.5, starValue]

          return (
            <span
              key={starValue}
              className={cn(
                "relative inline-flex items-center justify-center",
                cellSizeClasses[size]
              )}
            >
              <StarIcon fill={fill} className={sizeClasses[size]} />
              {halfValues.map((rating, halfIndex) => {
                const checked = currentValue === rating
                const tabIndex =
                  !disabled &&
                  (checked || (currentValue === null && rating === 0.5))
                    ? 0
                    : -1

                return (
                  <button
                    key={rating}
                    ref={(element) => {
                      radioRefs.current[Math.round(rating * 2) - 1] = element
                    }}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    aria-label={`${formatRating(rating)} stars`}
                    disabled={disabled}
                    tabIndex={tabIndex}
                    className={cn(
                      "absolute inset-y-0 inline-flex items-center justify-center rounded-sm transition-colors focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2",
                      halfIndex === 0 ? "left-0 w-1/2" : "right-0 w-1/2",
                      interactive && "cursor-pointer",
                      !interactive && "cursor-default"
                    )}
                    onMouseMove={() => handlePointerMove(rating)}
                    onClick={() => handleClick(rating)}
                    onKeyDown={(event) => handleKeyDown(event, rating)}
                  />
                )
              })}
            </span>
          )
        })}
      </div>
      {showValue && (
        <span className="text-sm tabular-nums text-[var(--fg-3)]">
          {currentValue === null ? "" : formatRating(currentValue)}
        </span>
      )}
    </div>
  )
}
