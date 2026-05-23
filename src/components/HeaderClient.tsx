"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JSX } from "react";

import { createClient } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderClientProps {
  user: {
    id: string;
    email: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

const navLinks = [
  { href: "/search", label: "films" },
  { href: "/search", label: "members" },
  { href: "/search", label: "lists" },
];

function getInitials(user: NonNullable<HeaderClientProps["user"]>): string {
  const source = user.username ?? user.email ?? "user";
  return source.slice(0, 2).toUpperCase();
}

export default function HeaderClient({
  user,
}: HeaderClientProps): JSX.Element {
  const router = useRouter();
  const profileHref = user?.username ? `/user/${user.username}` : "/settings";

  async function handleSignOut(): Promise<void> {
    const supabase = createClient();

    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 h-[56px] border-b border-[rgba(255,255,255,0.08)] bg-[var(--bg-1)]">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-6 px-6">
        <Link
          href="/"
          className="text-[18px] font-bold text-[var(--fg-1)] outline-none transition-colors duration-[120ms] focus-visible:text-[var(--fg-1)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          letterboxd4music
        </Link>

        <nav className="flex items-center gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[13px] text-[var(--fg-2)] outline-none transition-colors duration-[120ms] hover:text-[var(--fg-1)] focus-visible:text-[var(--fg-1)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-[76px] items-center justify-end">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)]">
                <Avatar size="sm">
                  {user.avatar_url ? (
                    <AvatarImage src={user.avatar_url} alt="" />
                  ) : null}
                  <AvatarFallback className="bg-[var(--bg-3)] text-[10px] font-semibold text-[var(--fg-2)]">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-32 bg-[var(--bg-1)] text-[var(--fg-2)]"
              >
                <DropdownMenuItem asChild>
                  <Link href={profileHref}>profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    void handleSignOut();
                  }}
                >
                  sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="btn-ghost rounded-full px-3 py-1.5 text-[13px] font-semibold text-[var(--fg-2)] outline-none transition-colors duration-[120ms] hover:bg-[var(--bg-2)] hover:text-[var(--fg-1)] focus-visible:ring-2 focus-visible:ring-[var(--green)]"
            >
              sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
