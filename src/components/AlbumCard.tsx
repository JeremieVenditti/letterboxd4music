import type { JSX } from "react";
import Image from "next/image";
import Link from "next/link";

import type { MusicBrainzAlbum } from "@/lib/musicbrainz";
import { cn } from "@/lib/utils";

interface AlbumCardProps {
  album: MusicBrainzAlbum;
  size?: "sm" | "md";
}

export default function AlbumCard({
  album,
  size = "md",
}: AlbumCardProps): JSX.Element {
  const alt = `Album cover for ${album.title} by ${album.artist}`;

  if (size === "sm") {
    return (
      <Link
        href={`/album/${album.id}`}
        className="grid grid-cols-[56px_1fr] gap-3 rounded-[4px] bg-[var(--bg-2)] p-2 outline-none transition duration-[120ms] hover:[outline:1.5px_solid_var(--green)] focus-visible:ring-2 focus-visible:ring-[var(--green)]"
      >
        <AlbumArtwork album={album} alt={alt} />
        <div className="min-w-0 self-center">
          <h3
            className="truncate text-[15px] font-bold leading-tight text-[var(--fg-1)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {album.title}
          </h3>
          <p className="truncate text-[13px] text-[var(--fg-2)]">
            {album.artist}
          </p>
          {album.releaseYear ? (
            <p className="font-mono text-[11px] text-[var(--fg-3)]">
              {album.releaseYear}
            </p>
          ) : null}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/album/${album.id}`}
      className="group block rounded-[4px] bg-[var(--bg-2)] p-2 outline-none transition duration-[120ms] hover:[outline:1.5px_solid_var(--green)] focus-visible:ring-2 focus-visible:ring-[var(--green)]"
    >
      <AlbumArtwork album={album} alt={alt} />
      <div className="mt-3 grid gap-1">
        <h3
          className="line-clamp-2 text-[15px] font-bold leading-tight text-[var(--fg-1)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {album.title}
        </h3>
        <p className="truncate text-[13px] text-[var(--fg-2)]">
          {album.artist}
        </p>
        {album.releaseYear ? (
          <p className="font-mono text-[11px] text-[var(--fg-3)]">
            {album.releaseYear}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function AlbumArtwork({
  album,
  alt,
}: {
  album: MusicBrainzAlbum;
  alt: string;
}): JSX.Element {
  return (
    <div className="relative aspect-square overflow-hidden rounded-[4px] bg-[var(--bg-3)]">
      {album.coverUrl ? (
        <Image
          src={album.coverUrl}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 16vw, (min-width: 768px) 25vw, 50vw"
          className="object-contain"
          unoptimized
        />
      ) : (
        <div
          aria-label={alt}
          role="img"
          className={cn(
            "flex size-full items-center justify-center",
            "text-[var(--fg-3)]"
          )}
        >
          <Image src="/vinyl.svg" alt="" width={32} height={32} aria-hidden />
        </div>
      )}
    </div>
  );
}
