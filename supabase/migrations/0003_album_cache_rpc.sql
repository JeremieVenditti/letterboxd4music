CREATE OR REPLACE FUNCTION public.cache_musicbrainz_album(
  p_musicbrainz_id text,
  p_title text,
  p_artist text,
  p_release_year smallint,
  p_cover_url text,
  p_genres text[]
)
RETURNS TABLE (
  id uuid,
  musicbrainz_id text,
  title text,
  artist text,
  release_year smallint,
  cover_url text,
  genres text[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH inserted AS (
    INSERT INTO public.albums (
      musicbrainz_id,
      title,
      artist,
      release_year,
      cover_url,
      genres
    )
    VALUES (
      p_musicbrainz_id,
      p_title,
      p_artist,
      p_release_year,
      p_cover_url,
      coalesce(p_genres, '{}')
    )
    ON CONFLICT (musicbrainz_id) DO UPDATE SET
      cover_url = coalesce(albums.cover_url, EXCLUDED.cover_url)
    RETURNING
      albums.id,
      albums.musicbrainz_id,
      albums.title,
      albums.artist,
      albums.release_year,
      albums.cover_url,
      albums.genres
  )
  SELECT
    inserted.id,
    inserted.musicbrainz_id,
    inserted.title,
    inserted.artist,
    inserted.release_year,
    inserted.cover_url,
    inserted.genres
  FROM inserted
  UNION ALL
  SELECT
    albums.id,
    albums.musicbrainz_id,
    albums.title,
    albums.artist,
    albums.release_year,
    albums.cover_url,
    albums.genres
  FROM public.albums
  WHERE albums.musicbrainz_id = p_musicbrainz_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.cache_musicbrainz_album(
  text,
  text,
  text,
  smallint,
  text,
  text[]
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.cache_musicbrainz_album(
  text,
  text,
  text,
  smallint,
  text,
  text[]
) TO anon, authenticated;
