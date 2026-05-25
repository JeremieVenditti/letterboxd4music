import type { JSX } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

interface AlbumCoverProps {
  src: string | null;
  alt: string;
  size: number;
  priority?: boolean;
  interactive?: boolean;
}

export default function AlbumCover({
  src,
  alt,
  size,
  priority = false,
  interactive = false,
}: AlbumCoverProps): JSX.Element {
  const className = cn(
    "relative overflow-hidden rounded-[4px] bg-[var(--bg-2)]",
    "aspect-square shrink-0 transition duration-[120ms] ease-out",
    interactive && "hover:scale-[1.02] hover:[outline:1.5px_solid_var(--green)]"
  );

  return (
    <div className={className} style={{ width: size, height: size }}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          priority={priority}
          className="size-full object-contain"
          unoptimized
        />
      ) : (
        <div
          aria-label={alt}
          className="flex size-full items-center justify-center bg-[var(--bg-3)] text-center font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--fg-3)]"
        >
          No cover
        </div>
      )}
    </div>
  );
}
