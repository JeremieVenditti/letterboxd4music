"use server";

import { revalidatePath } from "next/cache";

import type { Rating, Review } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

function sanitizeBody(body: string): string {
  return body.replace(/<[^>]*>/g, "").trim();
}

export async function upsertReview(
  albumId: string,
  body: string
): Promise<{ data: Review } | { error: string }> {
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
      .select("*")
      .eq("album_id", albumId)
      .eq("user_id", user.id)
      .maybeSingle<Rating>();

    if (ratingError) {
      return { error: ratingError.message };
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
        { onConflict: "user_id,album_id" }
      )
      .select("*")
      .single<Review>();

    if (error || !data) {
      return { error: error?.message ?? "Could not save review." };
    }

    revalidatePath(`/album/${albumId}`);

    return { data };
  } catch {
    return { error: "Could not save review." };
  }
}

export async function deleteReview(
  albumId: string
): Promise<{ success: true } | { error: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must sign in to delete a review." };
    }

    if (!(user.email_confirmed_at ?? user.confirmed_at)) {
      return { error: "Verify your email to delete reviews." };
    }

    const { data: rating, error: ratingError } = await supabase
      .from("ratings")
      .select("*")
      .eq("album_id", albumId)
      .eq("user_id", user.id)
      .maybeSingle<Rating>();

    if (ratingError) {
      return { error: ratingError.message };
    }

    if (!rating) {
      return { error: "You must rate this album before deleting its review." };
    }

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("album_id", albumId)
      .eq("user_id", user.id)
      .eq("rating_id", rating.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/album/${albumId}`);

    return { success: true };
  } catch {
    return { error: "Could not delete review." };
  }
}
