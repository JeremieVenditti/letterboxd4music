"use client";

import { useState, type FormEvent, type JSX } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

export default function ForgotPasswordPage(): JSX.Element {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(email: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setIsSubmitted(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    await handleSubmit(email);
    setIsSubmitting(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-0)] px-4 py-12 font-sans text-[var(--fg-1)]">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 text-center text-xl font-bold text-[var(--fg-1)]">
          letterboxd4music
        </div>
        <section className="rounded-[4px] bg-[var(--bg-2)] p-6">
          <h1 className="mb-2 text-xl font-semibold text-[var(--fg-1)]">
            reset your password
          </h1>
          <p className="mb-6 text-sm text-[var(--fg-2)]">
            enter your email and we will send you a reset link
          </p>

          {isSubmitted ? (
            <p className="mb-4 text-sm text-[var(--green)]">
              check your email
            </p>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-4">
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

            <Button
              type="submit"
              disabled={isSubmitting}
              className="btn-default h-10 w-full focus-visible:border-[var(--green)] focus-visible:ring-[3px] focus-visible:ring-[var(--green)]"
            >
              send reset link
            </Button>

            {error ? (
              <p className="text-[13px] text-[var(--danger)]">{error}</p>
            ) : null}
          </form>
        </section>
      </div>
    </main>
  );
}
