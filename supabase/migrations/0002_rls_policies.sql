ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_public
ON profiles
FOR SELECT
USING (true);

CREATE POLICY profiles_insert_own
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_own
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY albums_select_public
ON albums
FOR SELECT
USING (true);

CREATE POLICY albums_insert_auth
ON albums
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY albums_update_auth
ON albums
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY ratings_select_public
ON ratings
FOR SELECT
USING (true);

CREATE POLICY ratings_insert_own
ON ratings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY ratings_update_own
ON ratings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY ratings_delete_own
ON ratings
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY reviews_select_public
ON reviews
FOR SELECT
USING (true);

CREATE POLICY reviews_insert_own
ON reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY reviews_update_own
ON reviews
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY reviews_delete_own
ON reviews
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY review_likes_select_public
ON review_likes
FOR SELECT
USING (true);

CREATE POLICY review_likes_insert_own
ON review_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY review_likes_delete_own
ON review_likes
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY follows_select_public
ON follows
FOR SELECT
USING (true);

CREATE POLICY follows_insert_own
ON follows
FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY follows_delete_own
ON follows
FOR DELETE
USING (auth.uid() = follower_id);

CREATE POLICY lists_select_public
ON lists
FOR SELECT
USING (true);

CREATE POLICY lists_insert_own
ON lists
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY lists_update_own
ON lists
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY lists_delete_own
ON lists
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY list_albums_select_public
ON list_albums
FOR SELECT
USING (true);

CREATE POLICY list_albums_insert_own
ON list_albums
FOR INSERT
WITH CHECK (auth.uid() = (SELECT user_id FROM lists WHERE id = list_id));

CREATE POLICY list_albums_delete_own
ON list_albums
FOR DELETE
USING (auth.uid() = (SELECT user_id FROM lists WHERE id = list_id));
