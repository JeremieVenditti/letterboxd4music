import type { JSX } from "react";

export default function Loading(): JSX.Element {
  return (
    <div className="bg-[var(--bg-0)] text-[var(--fg-1)]">
      <section className="px-6 py-12">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[230px_1fr_360px] lg:items-end">
          <div className="aspect-square w-[230px] animate-pulse rounded-[4px] bg-[var(--bg-2)]" />
          <div>
            <div className="h-3 w-40 animate-pulse rounded-[4px] bg-[var(--bg-3)]" />
            <div className="mt-4 h-16 max-w-2xl animate-pulse rounded-[4px] bg-[var(--bg-2)]" />
            <div className="mt-6 flex gap-3">
              <div className="h-7 w-20 animate-pulse rounded-[4px] bg-[var(--bg-2)]" />
              <div className="h-7 w-28 animate-pulse rounded-[4px] bg-[var(--bg-2)]" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="h-[6px] animate-pulse rounded-full bg-[var(--bg-3)]" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
