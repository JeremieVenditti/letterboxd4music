# Progress log

## Roadmap

### Phase 1 — Foundation
- [x] **1.1** Supabase migrations: create all tables (profiles, albums, ratings, reviews, review_likes, follows, lists, list_albums) with RLS policies
- [x] **1.2** Auth pages: /login (sign up + login tabs), /auth/callback, password reset flow using Supabase Auth
- [x] **1.3** App shell: root layout with header (nav links, auth state, avatar dropdown) and footer

### Phase 2 — Core loop
- [x] **2.1** StarRating component at src/components/StarRating.tsx — half-star, 0.5–5.0, hover preview
- [x] **2.2** MusicBrainz API helpers in src/lib/musicbrainz.ts: searchAlbums(), getAlbum(), with Supabase caching layer for opening any MusicBrainz album and storing it locally on first fetch
- [x] **2.3** Album page at /album/[id]: cover art, metadata (title, artist, year, genres, tracklist), aggregate rating display
- [x] **2.4** Rating flow: submit/edit/delete rating on album page, connected to Supabase ratings table via server actions
- [ ] **2.5** Review flow: optional review form attached to rating, review list on album page, character limit 2000
- [ ] **2.6** Album discovery at /search: search MusicBrainz albums, open album pages from results, cache new albums in Supabase on demand

### Phase 3 — Profiles
- [ ] **3.1** User profile page at /user/[username]: 4 pinned favourite albums grid, recent ratings feed, recent reviews, stats (total rated, avg rating, top genres)
- [ ] **3.2** Settings at /settings: display name, bio, avatar upload to Supabase Storage, username change, email/password management, public vs private profile controls

### Phase 4 — Social
- [ ] **4.1** Follow/unfollow: follow button on profiles, followers/following counts, follows table RLS
- [ ] **4.2** Activity feed at /activity (auth-protected): chronological ratings + reviews from followed users
- [ ] **4.3** Review likes: like button on reviews, like_count update, review_likes table, one like per user
- [ ] **4.4** User discovery at /search: search users (profiles) alongside album results, with suggested follows during onboarding

### Phase 5 — Lists & polish
- [ ] **5.1** Lists: create/edit/delete list at /list/[id], add and reorder albums, ranked and unranked modes, user lists index at /user/[username]/lists
- [ ] **5.2** List social features: list likes, shareable list pages, commentable lists
- [ ] **5.3** SEO + Open Graph: meta tags and OG images for album pages and user profiles
- [ ] **5.4** Homepage at /: trending albums, recent community reviews, sign-up CTA for logged-out users
- [ ] **5.5** MVP hardening: paginated album reviews, submission rate limiting for ratings/reviews, accessibility pass, performance/Lighthouse pass

---

## Done

- [2026-05-23] **2.1** build a half-star rating component at src/components/StarRating.tsx — interactive, 0.5 to 5.0 in half-star increments, hover preview, displays current value
- [2026-05-23] **1.1** Supabase migrations: all tables + RLS policies
- [2026-05-23] work on phase 1.2
- [2026-05-23] Work on phase 1.3
- [2026-05-24] Look at the feedback.md document to understand where we are in working on phase 2.2. Finish the needed edits for this and make sure it works properly.
- [2026-05-24] Completed phase 2.2
- [2026-05-25] Completed phase 2.3 (I think)
- [2026-05-25] work on phase 2.4
