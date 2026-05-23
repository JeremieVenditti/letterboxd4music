"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type JSX } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage(): JSX.Element {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    password: string,
    confirmPassword: string
  ): Promise<void> {
    if (password !== confirmPassword) {
      setError("passwords must match");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/login?message=password_updated");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    await handleSubmit(password, confirmPassword);
    setIsSubmitting(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-0)] px-4 py-12 font-sans text-[var(--fg-1)]">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 text-center text-xl font-bold text-[var(--fg-1)]">
          letterboxd4music
        </div>
        <section className="rounded-[4px] bg-[var(--bg-2)] p-6">
          <h1 className="mb-6 text-xl font-semibold text-[var(--fg-1)]">
            enter new password
          </h1>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--fg-2)]">
                new password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="new-password"
                className="h-10 rounded-[4px] border-[var(--fg-4)] bg-[var(--bg-3)] text-[var(--fg-1)] transition-colors duration-[120ms] focus-visible:border-[var(--green)] focus-visible:ring-[3px] focus-visible:ring-[var(--green)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-[var(--fg-2)]">
                confirm password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                autoComplete="new-password"
                className="h-10 rounded-[4px] border-[var(--fg-4)] bg-[var(--bg-3)] text-[var(--fg-1)] transition-colors duration-[120ms] focus-visible:border-[var(--green)] focus-visible:ring-[3px] focus-visible:ring-[var(--green)]"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="btn-default h-10 w-full focus-visible:border-[var(--green)] focus-visible:ring-[3px] focus-visible:ring-[var(--green)]"
            >
              update password
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
