"use server";

import { revalidatePath } from "next/cache";

import type { Rating, Review } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

export type ReviewActionResult<T> = { data: T } | { error: string };

function sanitizeBody(body: string): string {
  return body.replace(/<[^>]*>/g, "").trim();
}

export async function upsertReview(
  albumId: string,
  body: string
): Promise<ReviewActionResult<Review>> {
  try {
    const sanitizedBody = sanitizeBody(body);

    if (!sanitizedBody) {
      return { error: "Review cannot be empty." };
    }

    if (sanitizedBody.length > 2000) {
      return { error: "Review must be 2,000 characters or fewer." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must sign in to review albums." };
    }

    if (!(user.email_confirmed_at ?? user.confirmed_at)) {
      return { error: "Verify your email to review albums." };
    }

    const { data: rating, error: ratingError } = await supabase
      .from("ratings")
      .select("id")
      .eq("album_id", albumId)
      .eq("user_id", user.id)
      .maybeSingle<Pick<Rating, "id">>();

    if (ratingError) {
      return { error: "Could not save review." };
    }

    if (!rating) {
      return { error: "You must rate this album before reviewing it." };
    }

    const { data, error } = await supabase
      .from("reviews")
      .upsert(
        {
          album_id: albumId,
          body: sanitizedBody,
          rating_id: rating.id,
          user_id: user.id,
        },
        { onConflict: "rating_id" }
      )
      .select("*")
      .single<Review>();

    if (error || !data) {
      return { error: "Could not save review." };
    }

    revalidatePath(`/album/${albumId}`);

    return { data };
  } catch {
    return { error: "Could not save review." };
  }
}

export async function deleteReview(
  albumId: string
): Promise<ReviewActionResult<{ success: true }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must sign in to review albums." };
    }

    if (!(user.email_confirmed_at ?? user.confirmed_at)) {
      return { error: "Verify your email to review albums." };
    }

    const { data: rating, error: ratingError } = await supabase
      .from("ratings")
      .select("id")
      .eq("album_id", albumId)
      .eq("user_id", user.id)
      .maybeSingle<Pick<Rating, "id">>();

    if (ratingError) {
      return { error: "Could not delete review." };
    }

    if (!rating) {
      return { error: "You must rate this album before reviewing it." };
    }

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("album_id", albumId)
      .eq("user_id", user.id)
      .eq("rating_id", rating.id);

    if (error) {
      return { error: "Could not delete review." };
    }

    revalidatePath(`/album/${albumId}`);

    return { data: { success: true } };
  } catch {
    return { error: "Could not delete review." };
  }
}
