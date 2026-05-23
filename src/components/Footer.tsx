import Link from "next/link";
import type { JSX } from "react";

export default function Footer(): JSX.Element {
  return (
    <footer className="bg-[var(--bg-1)] px-6 py-4 text-[12px] text-[var(--fg-4)]">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-center gap-2 sm:flex-row sm:justify-between">
        <span>letterboxd4music · © 2025</span>
        <div className="flex items-center gap-2">
          <Link href="/about" className="hover:text-[var(--fg-2)]">
            about
          </Link>
          <span>·</span>
          <Link href="/contact" className="hover:text-[var(--fg-2)]">
            contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
