import type { JSX } from "react";
import Image from "next/image";
import Link from "next/link";

import type { MusicBrainzAlbum } from "@/lib/musicbrainz";
import { cn } from "@/lib/utils";

interface AlbumCardProps {
  album: MusicBrainzAlbum;
  size?: "sm" | "md";
  href?: string;
  onOpen?: (album: MusicBrainzAlbum) => void | Promise<void>;
  isOpening?: boolean;
}

export default function AlbumCard({
  album,
  size = "md",
  href,
  onOpen,
  isOpening = false,
}: AlbumCardProps): JSX.Element {
  const alt = `Album cover for ${album.title} by ${album.artist}`;
  const className =
    size === "sm"
      ? "grid grid-cols-[56px_1fr] gap-3 rounded-[4px] bg-[var(--bg-2)] p-2 text-left outline-none transition duration-[120ms] hover:[outline:1.5px_solid_var(--green)] focus-visible:ring-2 focus-visible:ring-[var(--green)]"
      : "group block rounded-[4px] bg-[var(--bg-2)] p-2 text-left outline-none transition duration-[120ms] hover:[outline:1.5px_solid_var(--green)] focus-visible:ring-2 focus-visible:ring-[var(--green)]";
  const content = (
    <AlbumCardContent
      album={album}
      alt={alt}
      size={size}
      isOpening={isOpening}
    />
  );

  if (onOpen) {
    return (
      <button
        type="button"
        className={cn(className, "w-full cursor-pointer")}
        onClick={() => {
          void onOpen(album);
        }}
        disabled={isOpening}
        aria-busy={isOpening}
      >
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}

function AlbumCardContent({
  album,
  alt,
  size,
  isOpening,
}: {
  album: MusicBrainzAlbum;
  alt: string;
  size: "sm" | "md";
  isOpening: boolean;
}): JSX.Element {
  if (size === "sm") {
    return (
      <>
        <AlbumArtwork album={album} alt={alt} isOpening={isOpening} />
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
      </>
    );
  }

  return (
    <>
      <AlbumArtwork album={album} alt={alt} isOpening={isOpening} />
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
    </>
  );
}

function AlbumArtwork({
  album,
  alt,
  isOpening,
}: {
  album: MusicBrainzAlbum;
  alt: string;
  isOpening: boolean;
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
      {isOpening ? (
        <div className="absolute inset-0 grid place-items-center bg-[var(--bg-0)]/70 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--fg-2)]">
          opening
        </div>
      ) : null}
    </div>
  );
}
