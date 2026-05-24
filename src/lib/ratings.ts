import { cache } from "react";

import type {
  Album,
  AlbumPageData,
  Rating,
  RatingBucket,
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

export const getAlbumPageData = cache(async function getAlbumPageData(
  albumId: string
): Promise<AlbumPageData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: album } = await supabase
    .from("albums")
    .select("*")
    .eq("id", albumId)
    .maybeSingle<Album>();

  if (!album) {
    return null;
  }

  const [ratingsResult, reviewsResult, userRatingResult] = await Promise.all([
    supabase.from("ratings").select("*").eq("album_id", albumId),
    supabase
      .from("reviews")
      .select("*, profiles(username, display_name, avatar_url)")
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
      : Promise.resolve({ data: null }),
  ]);

  const ratings = (ratingsResult.data ?? []) as Rating[];
  const reviews = (reviewsResult.data ?? []) as ReviewWithProfile[];
  const userRating = (userRatingResult.data ?? null) as Rating | null;
  const isAuthenticated = !!user;
  const canRate = !!user?.email_confirmed_at;

  return {
    album,
    histogram: buildHistogram(ratings),
    reviews,
    userRating,
    canRate,
    isAuthenticated,
  };
});
