"use server";

import { revalidatePath } from "next/cache";

import type { Rating, Score } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

const VALID_SCORES = new Set<number>([0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]);

export async function upsertRating(
  albumId: string,
  score: Score
): Promise<{ data: Rating } | { error: string }> {
  if (!VALID_SCORES.has(score)) {
    return { error: "Invalid rating." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must sign in to rate albums." };
  }

  if (!(user.email_confirmed_at ?? user.confirmed_at)) {
    return { error: "Verify your email to rate albums." };
  }

  const { data, error } = await supabase
    .from("ratings")
    .upsert(
      {
        album_id: albumId,
        user_id: user.id,
        score,
      },
      { onConflict: "user_id,album_id" }
    )
    .select("*")
    .single<Rating>();

  if (error || !data) {
    return { error: error?.message ?? "Could not save rating." };
  }

  revalidatePath(`/album/${albumId}`);

  return { data };
}

export async function deleteRating(
  albumId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must sign in to delete a rating." };
  }

  const { error } = await supabase
    .from("ratings")
    .delete()
    .eq("album_id", albumId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/album/${albumId}`);

  return { success: true };
}
