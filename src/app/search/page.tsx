import type { JSX } from "react";

import SearchClient from "@/app/search/SearchClient";
import { searchAlbums } from "@/lib/musicbrainz";

interface SearchPageProps {
  searchParams: { q?: string };
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps): Promise<JSX.Element> {
  const resolvedSearchParams = await searchParams;
  const initialQuery = resolvedSearchParams.q?.trim() ?? "";
  const initialResults =
    initialQuery.length >= 2 ? await searchAlbums(initialQuery) : [];

  return (
    <SearchClient
      initialQuery={initialQuery}
      initialResults={initialResults}
    />
  );
}
