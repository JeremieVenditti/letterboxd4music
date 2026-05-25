import { cache } from "react";

import type {
  Album,
  AlbumPageData,
  Rating,
  RatingBucket,
  Review,
  ReviewWithProfile,
  Score,
} from "@/types/database";
import { createClient } from "@/utils/supabase/server";

const SCORES: Score[] = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export function buildHistogram(ratings: Rating[]): RatingBucket[] {
  return SCORES.map((score) => ({
    score,
    count: ratings.filter((rating) => Number(rating.score) === score).length,
  }));
}

export const getAlbumPageData: (
  albumId: string
) => Promise<AlbumPageData | null> = cache(async function getAlbumPageData(
  albumId: string
): Promise<AlbumPageData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: album, error: albumError } = await supabase
    .from("albums")
    .select("*")
    .eq("id", albumId)
    .maybeSingle<Album>();

  if (albumError || !album) {
    if (albumError) {
      console.error("Album query failed", albumError);
    }

    return null;
  }

  const [ratingsResult, reviewsResult, userRatingResult, userReviewResult] =
    await Promise.all([
      supabase.from("ratings").select("*").eq("album_id", albumId),
      supabase
        .from("reviews")
        .select("*, profiles(username, display_name, avatar_url), ratings(score)")
        .eq("album_id", albumId)
        .order("created_at", { ascending: false })
        .limit(50),
      user
        ? supabase
            .from("ratings")
            .select("*")
            .eq("album_id", albumId)
            .eq("user_id", user.id)
            .maybeSingle<Rating>()
        : Promise.resolve({ data: null, error: null }),
      user
        ? supabase
            .from("reviews")
            .select("*")
            .eq("album_id", albumId)
            .eq("user_id", user.id)
            .maybeSingle<Review>()
        : Promise.resolve({ data: null, error: null }),
    ]);

  let reviewsData = reviewsResult.data;

  if (reviewsResult.error) {
    console.error("Reviews query failed", reviewsResult.error);

    const fallbackReviewsResult = await supabase
      .from("reviews")
      .select("*, profiles(username, display_name, avatar_url)")
      .eq("album_id", albumId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (fallbackReviewsResult.error) {
      console.error("Fallback reviews query failed", fallbackReviewsResult.error);
      reviewsData = [];
    } else {
      reviewsData = fallbackReviewsResult.data;
    }
  }

  if (ratingsResult.error) {
    console.error("Ratings query failed", ratingsResult.error);
  }

  if (userRatingResult.error) {
    console.error("User rating query failed", userRatingResult.error);
  }

  if (userReviewResult.error) {
    console.error("User review query failed", userReviewResult.error);
  }

  const ratings = (ratingsResult.error ? [] : ratingsResult.data ?? []) as Rating[];
  const reviews = (reviewsData ?? []) as ReviewWithProfile[];
  const userRating = (userRatingResult.error ? null : userRatingResult.data ?? null) as Rating | null;
  const userReview = (userReviewResult.error ? null : userReviewResult.data ?? null) as Review | null;
  const isAuthenticated = !!user;
  const canRate = !!(user?.email_confirmed_at ?? user?.confirmed_at);

  return {
    album,
    histogram: buildHistogram(ratings),
    reviews,
    userRating,
    userReview,
    canRate,
    isAuthenticated,
    userId: user?.id ?? null,
  };
});
