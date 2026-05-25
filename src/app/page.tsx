import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center bg-[var(--bg-0)] px-6 py-20">
      <section className="mx-auto flex w-full max-w-4xl flex-col items-start gap-6">
        <h1 className="max-w-3xl font-[family:var(--font-display)] text-5xl font-semibold leading-tight text-[var(--fg-1)] md:text-7xl">
          Track the albums that stay with you.
        </h1>
        <p className="max-w-2xl font-sans text-lg leading-8 text-[var(--fg-2)]">
          Log in to rate records, write reviews, and build your music diary.
        </p>
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--green)] px-6 font-sans text-sm font-semibold text-[var(--bg-0)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2"
        >
          Sign up or log in
        </Link>
      </section>
    </div>
  );
}
