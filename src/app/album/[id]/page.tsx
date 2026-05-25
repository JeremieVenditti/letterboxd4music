import type { JSX } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import AlbumHero from "@/components/AlbumHero";
import ReviewList from "@/components/ReviewList";
import { getAlbumPageData } from "@/lib/ratings";

interface AlbumPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AlbumPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getAlbumPageData(id);

  if (!data) {
    return {};
  }

  const title = `${data.album.title} by ${data.album.artist} — Letterboxd4Music`;
  const avgRating =
    data.album.avg_rating === null
      ? "No average rating"
      : `${data.album.avg_rating.toFixed(2)} average rating`;
  const description = `${avgRating}. ${data.reviews.length} ${
    data.reviews.length === 1 ? "review" : "reviews"
  }.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: data.album.cover_url ? [data.album.cover_url] : undefined,
    },
  };
}

export default async function AlbumPage({
  params,
}: AlbumPageProps): Promise<JSX.Element> {
  const { id } = await params;
  const data = await getAlbumPageData(id);

  if (!data) {
    notFound();
  }

  return (
    <>
      <AlbumHero
        album={data.album}
        histogram={data.histogram}
        userRating={data.userRating}
        userReview={data.userReview}
        canRate={data.canRate}
        isAuthenticated={data.isAuthenticated}
      />
      <ReviewList reviews={data.reviews} currentUserId={data.userId} />
    </>
  );
}
