import type { JSX } from "react";

import HeaderClient from "@/components/HeaderClient";
import { createClient } from "@/utils/supabase/server";

interface ProfileRow {
  username: string | null;
  avatar_url: string | null;
}

export default async function Header(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <HeaderClient user={null} />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single<ProfileRow>();

  return (
    <HeaderClient
      user={{
        id: user.id,
        email: user.email ?? null,
        username: profile?.username ?? null,
        avatar_url: profile?.avatar_url ?? null,
      }}
    />
  );
}
