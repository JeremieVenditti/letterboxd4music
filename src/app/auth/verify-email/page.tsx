"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, type JSX } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

function VerifyEmailContent(): JSX.Element {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleResend(): Promise<void> {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("check your email");
    }

    setIsSubmitting(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-0)] px-4 py-12 font-sans text-[var(--fg-1)]">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 text-center text-xl font-bold text-[var(--fg-1)]">
          letterboxd4music
        </div>
        <section className="rounded-[4px] bg-[var(--bg-2)] p-6 text-center">
          <h1 className="mb-3 text-xl font-semibold text-[var(--fg-1)]">
            check your inbox
          </h1>
          <p className="mb-6 text-sm text-[var(--fg-2)]">
            we sent a verification link to your email
          </p>

          <Button
            type="button"
            disabled={isSubmitting || !email}
            onClick={handleResend}
            className="btn-default h-10 w-full focus-visible:border-[var(--green)] focus-visible:ring-[3px] focus-visible:ring-[var(--green)]"
          >
            resend email
          </Button>

          {message ? (
            <p className="mt-4 text-sm text-[var(--green)]">{message}</p>
          ) : null}
          {error ? (
            <p className="mt-4 text-[13px] text-[var(--danger)]">{error}</p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default function VerifyEmailPage(): JSX.Element {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
