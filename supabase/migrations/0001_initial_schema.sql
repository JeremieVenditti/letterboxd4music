CREATE TABLE profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      text UNIQUE NOT NULL,
  display_name  text,
  bio           text,
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 300),
  CONSTRAINT display_name_length CHECK (char_length(display_name) <= 50)
);

CREATE TABLE albums (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  musicbrainz_id  text UNIQUE NOT NULL,
  title           text NOT NULL,
  artist          text NOT NULL,
  release_year    smallint,
  cover_url       text,
  genres          text[] NOT NULL DEFAULT '{}',
  avg_rating      numeric(3,2),
  rating_count    integer NOT NULL DEFAULT 0,
  cached_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT release_year_range CHECK (release_year BETWEEN 1000 AND 2100),
  CONSTRAINT avg_rating_range   CHECK (avg_rating IS NULL OR avg_rating BETWEEN 0.5 AND 5.0),
  CONSTRAINT rating_count_nonneg CHECK (rating_count >= 0)
);

CREATE TABLE ratings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  album_id    uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  score       numeric(2,1) NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, album_id),
  CONSTRAINT score_halfstar CHECK (score IN (0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0))
);

CREATE TABLE reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id   uuid NOT NULL UNIQUE REFERENCES ratings(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  album_id    uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  body        text NOT NULL,
  like_count  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT body_length CHECK (char_length(body) BETWEEN 1 AND 2000)
);

CREATE TABLE review_likes (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_id  uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, review_id)
);

CREATE TABLE follows (
  follower_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE TABLE lists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  is_ranked   boolean NOT NULL DEFAULT false,
  like_count  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT title_length CHECK (char_length(title) BETWEEN 1 AND 100),
  CONSTRAINT description_length CHECK (description IS NULL OR char_length(description) <= 500)
);

CREATE TABLE list_albums (
  list_id    uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  album_id   uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  position   smallint,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (list_id, album_id)
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  candidate_username text;
  suffix text;
  suffix_number integer := 0;
BEGIN
  base_username := regexp_replace(coalesce(NEW.email, 'user'), '[^a-zA-Z0-9_]', '', 'g');

  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  base_username := substring(base_username from 1 for 28);

  IF char_length(base_username) < 3 THEN
    base_username := rpad(base_username, 3, '_');
  END IF;

  candidate_username := base_username;

  LOOP
    BEGIN
      INSERT INTO public.profiles (id, username)
      VALUES (NEW.id, candidate_username);
      RETURN NEW;
    EXCEPTION WHEN unique_violation THEN
      suffix_number := suffix_number + 1;
      suffix := '_' || suffix_number::text;
      candidate_username := substring(base_username from 1 for 30 - char_length(suffix)) || suffix;
    END;
  END LOOP;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_rating_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ratings_set_updated_at
BEFORE UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION public.set_rating_updated_at();

CREATE OR REPLACE FUNCTION public.recompute_album_rating(target_album_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE albums
  SET
    avg_rating = (
      SELECT AVG(score)
      FROM ratings
      WHERE album_id = target_album_id
    ),
    rating_count = (
      SELECT COUNT(*)::integer
      FROM ratings
      WHERE album_id = target_album_id
    )
  WHERE id = target_album_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_rating_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recompute_album_rating(NEW.album_id);
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_album_rating(OLD.album_id);
    RETURN OLD;
  END IF;

  IF OLD.album_id <> NEW.album_id THEN
    PERFORM public.recompute_album_rating(OLD.album_id);
    PERFORM public.recompute_album_rating(NEW.album_id);
  ELSE
    PERFORM public.recompute_album_rating(NEW.album_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER ratings_recompute_album_rating
AFTER INSERT OR UPDATE OR DELETE ON ratings
FOR EACH ROW
EXECUTE FUNCTION public.handle_rating_change();

CREATE OR REPLACE FUNCTION public.verify_review_rating_user()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT user_id FROM ratings WHERE id = NEW.rating_id) IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'review user_id must match rating user_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER reviews_verify_rating_user
BEFORE INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION public.verify_review_rating_user();

CREATE OR REPLACE FUNCTION public.increment_review_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE reviews
  SET like_count = like_count + 1
  WHERE id = NEW.review_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER review_likes_increment_like_count
AFTER INSERT ON review_likes
FOR EACH ROW
EXECUTE FUNCTION public.increment_review_like_count();

CREATE OR REPLACE FUNCTION public.decrement_review_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE reviews
  SET like_count = like_count - 1
  WHERE id = OLD.review_id;

  RETURN OLD;
END;
$$;

CREATE TRIGGER review_likes_decrement_like_count
AFTER DELETE ON review_likes
FOR EACH ROW
EXECUTE FUNCTION public.decrement_review_like_count();
