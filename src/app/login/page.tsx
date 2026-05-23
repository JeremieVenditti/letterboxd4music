"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent, type JSX } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

type Tab = "login" | "signup";

function LoginForm(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const message =
    searchParams.get("message") === "password_updated"
      ? "your password has been updated"
      : null;
  const callbackError =
    searchParams.get("error") === "auth_callback_failed"
      ? "the sign-in link is invalid or expired"
      : null;

  async function handleLogin(email: string, password: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleSignup(email: string, password: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (tab === "login") {
      await handleLogin(email, password);
    } else {
      await handleSignup(email, password);
    }

    setIsSubmitting(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-0)] px-4 py-12 font-sans text-[var(--fg-1)]">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 text-center text-xl font-bold text-[var(--fg-1)]">
          letterboxd4music
        </div>
        <section className="rounded-[4px] bg-[var(--bg-2)] p-6">
          <div className="mb-6 grid grid-cols-2 border-b border-[var(--fg-4)]">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setError(null);
              }}
              className={`border-b-2 px-3 pb-3 text-sm font-semibold outline-none transition-colors duration-[120ms] focus-visible:border-[var(--green)] focus-visible:text-[var(--fg-1)] ${
                tab === "login"
                  ? "border-[var(--green)] text-[var(--fg-1)]"
                  : "border-transparent text-[var(--fg-3)]"
              }`}
            >
              sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                setError(null);
              }}
              className={`border-b-2 px-3 pb-3 text-sm font-semibold outline-none transition-colors duration-[120ms] focus-visible:border-[var(--green)] focus-visible:text-[var(--fg-1)] ${
                tab === "signup"
                  ? "border-[var(--green)] text-[var(--fg-1)]"
                  : "border-transparent text-[var(--fg-3)]"
              }`}
            >
              create account
            </button>
          </div>

          {message ? (
            <p className="mb-4 text-sm text-[var(--green)]">{message}</p>
          ) : null}
          {callbackError ? (
            <p className="mb-4 text-[13px] text-[var(--danger)]">
              {callbackError}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--fg-2)]">
                email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="h-10 rounded-[4px] border-[var(--fg-4)] bg-[var(--bg-3)] text-[var(--fg-1)] transition-colors duration-[120ms] focus-visible:border-[var(--green)] focus-visible:ring-[3px] focus-visible:ring-[var(--green)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--fg-2)]">
                password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete={
                  tab === "login" ? "current-password" : "new-password"
                }
                className="h-10 rounded-[4px] border-[var(--fg-4)] bg-[var(--bg-3)] text-[var(--fg-1)] transition-colors duration-[120ms] focus-visible:border-[var(--green)] focus-visible:ring-[3px] focus-visible:ring-[var(--green)]"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="btn-default h-10 w-full focus-visible:border-[var(--green)] focus-visible:ring-[3px] focus-visible:ring-[var(--green)]"
            >
              {tab === "login" ? "sign in" : "create account"}
            </Button>

            {error ? (
              <p className="text-[13px] text-[var(--danger)]">{error}</p>
            ) : null}
          </form>

          {tab === "login" ? (
            <Link
              href="/auth/forgot-password"
              className="mt-4 block text-center text-sm text-[var(--fg-3)] outline-none focus-visible:text-[var(--green)]"
            >
              forgot password
            </Link>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default function LoginPage(): JSX.Element {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
