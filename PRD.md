# Album Rating App — Product Requirements Document

> Version 1.0 — May 2025 | Status: Draft

| Field | Value |
|-------|-------|
| Product | Album Rating App (working title) |
| Author | TBD |
| Status | Draft |
| Target launch | Q4 2025 (web MVP) |

---

## 1. Overview

### 1.1 Problem statement

Music listeners have no elegant, social-first platform to log albums, rate them, and share opinions. Last.fm is scrobble-focused and lacks a review culture. RateYourMusic has the data depth but suffers from dated UX and poor discoverability. Letterboxd proved the model works for film — that same experience is entirely absent for albums.

### 1.2 Vision

A clean, opinionated platform where music listeners can rate albums they've heard, write short reviews, follow friends, and discover music through taste — not algorithms.

### 1.3 Target users

**Primary: The music enthusiast**
- Listens widely across genres, formats, and eras
- Wants a personal log of everything they've heard with ratings
- Values their own opinion and wants to articulate it

**Secondary: The social listener**
- Curious what friends and followed users think about albums
- Discovers music via taste networks rather than editorial playlists
- May post less but reads and engages with reviews frequently

---

## 2. Goals & success metrics

| Goal | Metric | Target (6 months post-launch) |
|------|--------|-------------------------------|
| Drive album ratings | Ratings logged | 10,000+ |
| Build community | Registered users | 2,000+ |
| Encourage reviews | % ratings with review | >30% |
| Retain users | D30 retention | >25% |
| Album coverage | Albums in database | 100,000+ |

---

## 3. Feature requirements

| Priority | Feature | Description | Phase |
|----------|---------|-------------|-------|
| P1 | Album search | Search any album by title or artist. Pull metadata (cover art, tracklist, release year, genre) from external API. | MVP |
| P1 | Rating | Half-star ratings out of 5. One rating per user per album, editable. Displayed as aggregate on album page. | MVP |
| P1 | Reviews | Optional short-form text review attached to a rating. Public by default. Other users can like reviews. | MVP |
| P1 | User profile | Public profile: rating history, recent reviews, 4 pinned favourite albums, stats (total rated, avg rating, genres). | MVP |
| P1 | Album page | Dedicated page per album: aggregate rating, rating count, all reviews, histogram of ratings. | MVP |
| P1 | Auth | Email/password sign-up and login via Supabase Auth. Email verification. Password reset. | MVP |
| P2 | Follow system | Follow other users. Activity feed shows recent ratings and reviews from followed users chronologically. | MVP |
| P2 | Lists | Create ranked or unranked album lists (e.g. "Top 10 of 2024"). Shareable, likeable, commentable. | MVP |
| P2 | User search | Search for users by username. Suggested follows on signup based on popular reviewers. | MVP |
| P3 | Listening diary | "Listened on [date]" log. Track when you heard an album, separate from rating. | v1.1 |
| P3 | Social auth | Sign in with Google (and optionally Apple). Simplifies onboarding. | v1.1 |
| P3 | Notifications | In-app notifications for: new followers, likes on reviews, comments on lists. | v1.1 |

### 3.1 Out of scope (v1)

- Music playback or streaming integration
- Track-level ratings (album only for MVP)
- Native iOS or Android app (web-first, responsive)
- Recommendation engine
- Podcast episodes or EPs as primary content type
- Import from Spotify listening history

---

## 4. Technical architecture

### 4.1 Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 14+ (App Router, TypeScript) | SSR for album and profile pages improves SEO and sharing. App Router enables per-route caching strategies. |
| Styling | Tailwind CSS + shadcn/ui | Utility-first CSS with a polished, accessible component library. Consistent design system out of the box. |
| Database | Supabase (Postgres) | Managed Postgres with built-in auth, row-level security, realtime subscriptions, and a generous free tier. |
| Auth | Supabase Auth | Email/password for MVP. Social providers (Google, Apple) added in v1.1. JWT-based sessions. |
| Deployment | Vercel | Zero-config Next.js deployment. Edge functions, preview deployments per PR, and Vercel Analytics. |
| Repo | GitHub (public) | Public repo enables open contribution and transparency. Issue tracker for roadmap visibility. |
| Music data | MusicBrainz + Cover Art Archive | 100% free, open-source, no API key required, no restrictive ToS. See section 4.2 for detail. |

### 4.2 Music data API decision

> ⚠️ **Spotify API: not recommended for this use case.**

As of May 2025, Spotify has significantly restricted API access for indie developers:

- Developers must hold a Spotify Premium subscription to use Developer Mode
- Test user limit reduced from 25 to just 5 per app
- Extended quota access (required for public launch) now requires a legally registered business and 250,000 monthly active users
- These changes effectively make the Spotify API inaccessible to indie/solo developers at launch

**Recommended approach: MusicBrainz + Cover Art Archive**

- **MusicBrainz** — open music encyclopaedia with comprehensive album metadata (title, artist, year, tracklist, genres, release country). Completely free, no API key required, used by millions of apps.
- **Cover Art Archive** — sister project hosting album cover images. Free CDN, permissive licensing.
- **Strategy** — search MusicBrainz on user query, cache results in your Supabase DB after first fetch to reduce API calls and stay within rate limits (1 req/sec unauthenticated).
- **Fallback** — TheAudioDB offers an additional free tier with richer images where MusicBrainz coverage is thin.

Spotify can be revisited once the app has traction and a legally registered entity.

### 4.3 Authentication strategy

**MVP (Phase 1)**
- Email + password via Supabase Auth
- Email verification required before posting reviews
- Password reset via email magic link
- Session managed via Supabase JWT + Next.js middleware

**v1.1 (Phase 2)**
- Google OAuth via Supabase social providers
- Apple Sign In — required for iOS App Store submission
- Merge accounts: if same email used across providers, merge into one profile

> Note: Supabase Auth handles all token refresh, session storage, and PKCE flows. No custom auth infrastructure needed for MVP.

---

## 5. Data model (Supabase / Postgres)

| Table | Key columns |
|-------|-------------|
| `profiles` | id (uuid, FK auth.users), username, display_name, bio, avatar_url, created_at |
| `albums` | id, musicbrainz_id, title, artist, release_year, cover_url, genres[], avg_rating, rating_count, cached_at |
| `ratings` | id, user_id (FK profiles), album_id (FK albums), score (0.5–5.0), created_at, updated_at |
| `reviews` | id, rating_id (FK ratings), user_id, album_id, body (text), like_count, created_at |
| `review_likes` | user_id, review_id, created_at — composite PK |
| `follows` | follower_id (FK profiles), following_id (FK profiles), created_at — composite PK |
| `lists` | id, user_id, title, description, is_ranked, like_count, created_at |
| `list_albums` | list_id, album_id, position (nullable), created_at |

Row-level security (RLS) enabled on all tables. Profiles and reviews are publicly readable. Ratings, follows, and likes are write-gated to authenticated users only.

---

## 6. Page & route structure

| Route | Description |
|-------|-------------|
| `/` | Homepage: trending albums, recent reviews from community, sign-up CTA |
| `/album/[id]` | Album page: cover, metadata, aggregate rating histogram, paginated reviews |
| `/user/[username]` | Public profile: favourites grid, recent ratings, review feed, stats |
| `/user/[username]/lists` | User's lists index |
| `/list/[id]` | Single list page |
| `/activity` | Authenticated: feed from followed users (protected route) |
| `/search` | Search albums and users |
| `/settings` | Account settings: profile edit, email, password, connected accounts |
| `/login` | Login / sign-up page |

---

## 7. Build order (recommended)

Each phase should be deployable and testable independently. Do not start phase N+1 until phase N is stable.

### Phase 1 — Foundation
- [ ] Repo setup: Next.js 14, TypeScript, Tailwind, shadcn/ui, ESLint, Prettier
- [ ] Supabase project: profiles table, RLS policies, auth config
- [ ] Auth flows: sign up, login, logout, email verification, password reset
- [ ] Basic nav shell and layout components

### Phase 2 — Core loop
- [ ] MusicBrainz API integration: search endpoint, album detail fetch, caching layer
- [ ] Album page: metadata display, cover art, tracklist
- [ ] Rating UI: half-star component, submit/edit/delete rating
- [ ] Review UI: attach review to rating, display on album page

### Phase 3 — Profiles
- [ ] User profile page: favourites grid (4 pinned), rating history, stats
- [ ] Profile edit: avatar upload (Supabase Storage), bio, display name
- [ ] Public vs private views (logged in vs logged out)

### Phase 4 — Social
- [ ] Follow / unfollow users
- [ ] Activity feed: chronological ratings + reviews from followed users
- [ ] Review likes
- [ ] User search

### Phase 5 — Lists & polish
- [ ] Create, edit, and delete lists
- [ ] Add/remove/reorder albums in lists
- [ ] List likes
- [ ] Performance audit, Lighthouse scores, SEO meta tags
- [ ] Open Graph images for album and profile pages

---

## 8. Non-functional requirements

### 8.1 Performance
- Album and profile pages must achieve Lighthouse performance score >85
- Album search response <500ms (p95) via cached MusicBrainz results
- Cover art served via CDN (Cover Art Archive CDN by default, Supabase Storage for user avatars)

### 8.2 SEO
- Album pages and user profiles must be server-rendered for indexability
- Open Graph and Twitter Card meta tags on all public pages
- Canonical URLs on paginated content

### 8.3 Accessibility
- WCAG 2.1 AA compliance target
- Star rating component keyboard-navigable
- All images have alt text (album covers use `"Album cover for [title] by [artist]"`)

### 8.4 Security
- All DB writes protected by Supabase RLS policies
- Input sanitisation on review text (strip HTML, limit to 2,000 chars)
- Rate limiting on rating and review submission endpoints

---

## 9. Future roadmap

| Timeframe | Features |
|-----------|----------|
| v1.1 | Listening diary, Google/Apple auth, in-app notifications, PWA install prompt |
| v1.2 | Native iOS app (Expo/React Native), push notifications, App Store launch |
| v2.0 | Recommendation engine based on taste graph, decade/genre filters and charts |
| v2.x | Spotify import (pending API access), EP and single ratings, artist pages |

---

## 10. Open questions

- **Product name** — working title needed before domain registration and App Store listing
- **Monetisation** — free forever, freemium (pro profile customisation), or donation-based?
- **Content moderation** — review flagging, block/mute system, spam handling at scale
- **Album vs release** — should deluxe editions, remasters, and regional variants be separate entries or merged?
- **EPs and singles** — include in MVP or albums only?
- **Username policy** — max length, allowed characters, reservation of offensive terms

---

*End of document*