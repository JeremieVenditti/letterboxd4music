# Letterboxd4Music — Design Rules

This is the rulebook. Drop it in your repo at `DESIGN.md`. When in doubt, **be more like the rules than less like them.**

The product is a social network for album lovers — Letterboxd's social cataloging DNA, Spotify's music UI grammar, retro charm via cream rubber-stamp stickers. Dark mode primary. Soul, not camp.

---

## TL;DR — the ten commandments

1. **Background is `#0E1014`.** Never pure black, never light by default.
2. **Spotify-green is sacred** — `#1ED760` for ratings, "logged" state, the play button, anything positive.
3. **Three accents only:** coral (`#F26B5B`), indigo (`#5B4DA6`), mustard (`#F4C842`). No invented colors.
4. **Cream `#F3E9D2`** is for stickers. It is the only paper-color in the system.
5. **Album titles in Fraunces.** UI in Inter. Catalog meta (years, durations, eyebrows) in JetBrains Mono. All free.
6. **Stars are halves.** `★★★★½`, always green. No 10-point scales, no letter grades.
7. **Album covers are 1:1, 4px radius, never cropped.** Hover = 1.5px green outline.
8. **The album-art gradient hero** is the borrowed Spotify move. Dominant cover color, radial-fade to background.
9. **Stickers are the ONE retro device.** Use them liberally. Don't add any other retro device.
10. **Tone is music-nerd-confessional.** Lowercase, writerly, no exclamation points, no emoji in chrome.

---

## COLORS

```css
:root {
  /* brand accents */
  --green:   #1ED760;  /* ratings, logged, play, positive */
  --coral:   #F26B5B;  /* heart/like, warm highlight */
  --indigo:  #5B4DA6;  /* links, info */
  --mustard: #F4C842;  /* sparingly — 5★, special */
  --cream:   #F3E9D2;  /* stickers / paper labels */
  --heart:   var(--coral);

  /* dark surfaces */
  --bg-0:    #0E1014;  /* page */
  --bg-1:    #161A20;  /* nav, footer */
  --bg-2:    #1B1F26;  /* cards, dropdowns */
  --bg-3:    #29303A;  /* selected/hover */

  /* foreground */
  --fg-1:    #FFFFFF;  /* headings */
  --fg-2:    #C4C4C4;  /* body */
  --fg-3:    #909090;  /* meta */
  --fg-4:    #5D6571;  /* faded / dividers */

  /* semantic */
  --link:    var(--indigo);
  --danger:  #EF5350;
}
```

### Rules
- **Never invent a new color.** If you need a new shade, derive it (`color-mix()` or alpha) from these.
- **Never use pure black or pure white as backgrounds.** Always `--bg-0` and `--cream` respectively.
- Light theme is **rare.** When used: `--cream` background, `--bg-0` foreground.
- **No bluish-purple gradient marketing washes.** No safety-orange. Both were rejected for B-Side.
- The **album-art radial gradient** is the only gradient you should reach for. Pattern:
  ```css
  background:
    radial-gradient(ellipse 80% 70% at 30% 30%, var(--album-dom) 0%, transparent 70%),
    linear-gradient(180deg, var(--album-dom) 0%, var(--bg-0) 70%);
  ```

---

## TYPOGRAPHY

### Stack

```css
--font-display: "Fraunces", serif;                  /* album titles, big headings */
--font-sans:    "Inter", sans-serif;                /* UI, body, buttons */
--font-mono:    "JetBrains Mono", monospace;        /* catalog, meta, eyebrows */
```

All three are free. Load from Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300..800,0..100&family=Inter:wght@400..800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

### Fraunces — variable-axis defaults

```css
.album-title, h1, h2, h3 {
  font-family: var(--font-display);
  font-variation-settings: "opsz" 144, "SOFT" 80;
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.05;
}
```

The `SOFT` axis is where the soul lives. Keep it at 80 — warmer curves without going kitsch. Don't push beyond 100.

### Scale

| Size | Use |
|---|---|
| `64px` | Album page hero title |
| `48px` | Marketing H1 |
| `36px` | Section H2 |
| `28px` | Subsection / card title |
| `22px` | H3 |
| `15px` | Review body / large body |
| `13–14px` | Body / nav / buttons |
| `11px` | Mono eyebrows, meta, catalog numbers |

### Rules

- **Headings always in Fraunces.** Body, buttons, inputs always in Inter. Catalog/meta always in mono. Don't mix them up.
- **Album titles always get Fraunces**, even tiny ones (down to 13px is fine — Fraunces holds at small sizes).
- **Eyebrows are mono, UPPERCASE, `letter-spacing: 0.14em`, 11px, 700.** E.g. `POPULAR REVIEWS THIS WEEK`.
- **No system fonts.** Specify the stack with fallbacks but design assuming the brand fonts load.
- **No italic flourishes** except inside Fraunces for taglines or pull-quotes. Don't italicize UI.
- **`text-wrap: pretty`** on paragraphs of 2+ lines.

---

## STICKERS — the one retro device

The sticker is the soul of this brand. It's a small cream paper label with a thick black border, an offset drop-shadow, and a slight tilt.

```css
.sticker {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--cream);            /* default fill */
  color: #14181C;
  border: 1.5px solid #14181C;
  border-radius: 4px;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.4);
  transform: rotate(-3deg);
  padding: 4px 10px;
  font-family: var(--font-display);    /* Fraunces 700 */
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}
```

### Variants (just swap `background` + adjust `color`)

| Variant | Background | Color | Use |
|---|---|---|---|
| Default | `--cream` | `#14181C` | Catalog meta (`1972 · UK`), `PRO`, `STAFF PICK` |
| Coral   | `--coral` | `#14181C` | `♥ LIKED`, heart-related |
| Indigo  | `--indigo`| `#FFFFFF` | `ON REPEAT`, `B-SIDE`, info |
| Green   | `--green` | `#0E1014` | `LOGGED`, positive |
| Mustard | `--mustard`| `#14181C`| `5★`, anniversary, special |

### Sticker rules

- **Use them liberally.** Overlap album covers (`position: absolute; top: -6px; right: -10px;`), inline next to member names, in rows under album metadata.
- **The rotation matters.** -3° is the default. ±1° variation is fine for adjacent stickers — they feel placed by hand. Don't go past ±5°.
- **The drop-shadow is non-negotiable.** Without `2px 2px 0` they look like flat pills.
- **Keep them short.** 1–3 words. `STAFF PICK` is the maximum length you should design for.
- **Don't use them as buttons.** They're indicators / metadata. Buttons are buttons.

### Example: sticker on an album cover

```html
<div style="position: relative;">
  <img src="cover.jpg" class="album-cover" />
  <span class="sticker" style="position: absolute; top: -6px; right: -10px; background: var(--coral);">
    ★ STAFF PICK
  </span>
</div>
```

---

## STARS & HEART

```html
<!-- 4.5 stars -->
<span class="stars">★★★★½</span>

<style>
.stars { color: var(--green); letter-spacing: 0.5px; font-size: 14px; }
.stars.muted { color: var(--fg-4); }
</style>
```

For interactive rating, use real glyphs:

```js
// Render N out of 5 with halves
const renderStars = (value) => {
  let v = value, out = "";
  for (let i = 0; i < 5; i++) {
    if (v >= 1) { out += "★"; v -= 1; }
    else if (v >= 0.5) { out += "½"; v = 0; }
    else { out += '<span style="opacity:.25">★</span>'; }
  }
  return out;
};
```

Heart:
```html
<svg width="18" height="18" viewBox="0 0 24 24" fill="var(--coral)">
  <path d="M12 21s-7.5-4.7-9.5-9.4C1 8 3.5 4.5 7 4.5c2 0 3.5 1 5 2.7 1.5-1.7 3-2.7 5-2.7 3.5 0 6 3.5 4.5 7.1C19.5 16.3 12 21 12 21z"/>
</svg>
```

---

## SPACING

4px base grid. Use the scale:

```css
--s-1: 4px;  --s-2: 8px;  --s-3: 12px;  --s-4: 16px;
--s-5: 20px; --s-6: 24px; --s-8: 32px;  --s-10: 40px;
--s-12: 48px; --s-16: 64px;
```

Default component padding: **`12px 16px`** for compact, **`16px 20px`** for comfortable.

Default gap between siblings:
- Tight rows (chips, stickers): `8px`
- Card grids: `14–16px`
- Sections: `32–48px`

**Always use `gap` on flex/grid containers**, not margins between siblings.

---

## RADII

```css
--r-sm: 2px;    /* tiny corners */
--r-md: 4px;    /* default — cards, covers, buttons */
--r-lg: 8px;    /* heroes, panels */
--r-pill: 999px; /* tags, pill buttons, play button, search input */
```

**Album covers are 4px. Always.** Don't round them more. Don't square them.

---

## SHADOWS

Almost nothing. Elevation is implied by background lightness — `--bg-2` sits above `--bg-0`.

The exceptions:

```css
--shadow-sticker: 2px 2px 0 rgba(0,0,0,0.4);   /* offset drop, only on stickers */
--shadow-modal:   0 12px 40px rgba(0,0,0,0.5); /* only on modal dialogs */
```

Never use blurry soft shadows on cards. Never use a colored shadow.

---

## ANIMATIONS

Restrained. Use `--t-fast` for hovers (`120ms ease`).

```css
--t-fast: 120ms ease;
--t-base: 160ms ease;
--t-slow: 220ms ease-out;
```

- Links: color transition 120ms
- Album covers: outline + scale on hover (`1.5px solid var(--green)`, `scale(1.02)`)
- Buttons: darken on hover, scale(0.98) on press
- Heart fill: brief scale punch when toggled (the one bit of personality)

**No bounces, no springs.** Easing is `ease`, `ease-out`. Never `ease-in-out` for anything user-driven.

---

## COMPONENTS

### Album cover

1:1 aspect, 4px radius. Always.

```css
.album-cover {
  aspect-ratio: 1/1;
  border-radius: 4px;
  overflow: hidden;
  transition: outline 120ms ease, transform 120ms ease;
  outline: 0 solid var(--green);
}
.album-cover:hover {
  outline: 1.5px solid var(--green);
  transform: scale(1.02);
}
```

### Buttons

```css
/* Primary — green pill, used for "PLAY" and primary CTAs */
.btn-play {
  background: var(--green); color: #0E1014;
  border: 0; border-radius: 999px;
  padding: 10px 20px;
  font: 700 12px/1 "Inter"; letter-spacing: 0.04em;
}

/* Secondary — ghost pill */
.btn-ghost {
  background: transparent; color: #fff;
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 999px; padding: 9px 18px;
  font: 600 12px/1 "Inter";
}

/* Square / form — Sign in, etc */
.btn-default {
  background: var(--bg-2); color: #fff;
  border: 0; border-radius: 4px;
  padding: 9px 16px; font: 600 13px/1 "Inter";
}

/* Pro / upgrade — indigo */
.btn-pro {
  background: var(--indigo); color: #fff;
  border: 0; border-radius: 4px;
  padding: 9px 16px; font: 700 13px/1 "Inter";
}
```

### Album page hero

The signature pattern. Dominant cover color drives a radial gradient that fades to the page background.

```html
<section class="album-hero" style="--dom: #C9683A;">
  <div class="hero-gradient"></div>
  <div class="hero-content">
    <img class="album-cover" src="cover.jpg" width="230" />
    <div>
      <div class="eyebrow">ALBUM · 2007</div>
      <h1>In Rainbows</h1>
      <div class="meta">RADIOHEAD</div>
      <div class="stars">★★★★½</div>
    </div>
  </div>
</section>

<style>
.album-hero { position: relative; min-height: 460px; }
.hero-gradient {
  position: absolute; inset: 0; z-index: 0;
  background:
    radial-gradient(ellipse 80% 70% at 30% 30%, var(--dom) 0%, transparent 70%),
    linear-gradient(180deg, var(--dom) 0%, var(--bg-0) 70%);
  opacity: 0.85;
}
.hero-content { position: relative; z-index: 1; }
</style>
```

### Review card

```html
<article class="review-card">
  <img class="album-cover" src="cover.jpg" width="64" />
  <div>
    <h3 class="album-title">Blue</h3>
    <span class="meta">JONI MITCHELL · 1971</span>
    <div class="review-meta">
      <div class="avatar"></div>
      <span>by <strong>samira_listens</strong></span>
      <span class="stars">★★★★★</span>
      <span style="color: var(--coral)">♥</span>
    </div>
    <p>"i think the secret of 'a case of you' is that she's not actually drinking..."</p>
    <div class="meta">1,832 likes · 41 comments</div>
  </div>
</article>
```

Border between reviews: `1px solid var(--bg-2)`. No card background, just a separator.

### Eyebrows

```html
<div class="eyebrow">POPULAR REVIEWS THIS WEEK</div>

<style>
.eyebrow {
  font-family: var(--font-mono);
  font-size: 11px; font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--fg-3);
}
</style>
```

---

## ICONOGRAPHY

Custom outline set, 1.8px stroke, rounded line caps. Sized:
- Nav: 18–22px
- Inline body: 16px
- Hero / marketing: 36px+

Music-specific icons we ship:
- `vinyl.svg` — "listened" / logged record
- `headphones.svg` — listening
- `repeat.svg` — on-repeat status
- `play.svg` — filled play triangle

Inherited from Letterboxd:
- `star.svg`, `star-half.svg`, `heart.svg`, `heart-fill.svg`
- `review.svg`, `list.svg`, `diary.svg`, `home.svg`, `search.svg`, `profile.svg`, `plus.svg`

**No emoji in chrome.** Members use them freely in reviews. Iconic typeset glyphs (★ ½ ♥ ▶) are fine.

---

## CONTENT / COPY

### Voice
- **Music-nerd-confessional.** Warm, knowing, slightly arch.
- **Writerly.** Sentences breathe. Long reviews are encouraged.
- **Second-person, direct.** "Keep track of every album you've ever listened to."
- **Lowercase brand wordmark.** "letterboxd4music" in logo; "Letterboxd4Music" in body.
- **No hype.** No 🚀, no "supercharge," no marketing exclamation points.

### Casing
- **Sentence case** for everything user-facing — headlines, buttons, page titles. "Sign in," not "Sign In."
- **Title case** for album / track / list titles only.
- **ALL CAPS** only for eyebrows, sticker text, catalog meta. Always paired with `letter-spacing: 0.14em` if mono.

### Microcopy
- "The social network for album lovers."
- "Keep track of every album you've ever listened to (or just start from the day you join)."
- "Rate each album on a five-star scale (with halves) to record and share your reaction."
- "Log a record you've spun." — a "log" is the basic unit of activity.
- Buttons: "Listen," "Log," "Like," "Add to list," "Review," "Sign in."
- Empty states: warm, reference listening. "Your shelf is empty. Log your first record to get started."

### Numbers
- Write out small numbers in body copy ("five-star scale").
- Digits for stats ("1,832 likes", "412 followers", "17M members").
- Track durations and years always in mono.

---

## NEVER DO

- ❌ Pure black backgrounds
- ❌ Light theme as default
- ❌ Pure white text (use `--fg-1` which is white, but never apply it to non-heading body)
- ❌ Bluish-purple marketing gradients
- ❌ Safety-orange (`#FF8000`)
- ❌ Drop shadows on cards
- ❌ Emoji in product chrome
- ❌ Title Case on UI labels or buttons
- ❌ "🚀 supercharge your listening" energy
- ❌ More than one retro device (stickers are it — no grain, no polaroids, no spinning vinyl background)
- ❌ Custom one-off colors. Pick from the palette.
- ❌ Inventing new fonts. Fraunces / Inter / JetBrains Mono only.
- ❌ Rotation on anything that isn't a sticker
- ❌ Stars without half-star support
- ❌ Cropping album covers

---

## ALWAYS DO

- ✅ Use the token names (`var(--green)`, not `#1ED760` inline)
- ✅ Use `gap` on flex/grid, never margins between siblings
- ✅ Use `aspect-ratio: 1/1` on album covers
- ✅ Add `transform: rotate(-3deg)` to every sticker
- ✅ Use mono for catalog meta and eyebrows
- ✅ Use Fraunces for album titles, even small ones
- ✅ Lowercase your reviews and member-facing copy unless it's a proper noun
- ✅ Render the album-art gradient hero on any album detail surface

---

*That's the rulebook. If you find yourself wanting to break a rule, screenshot what you're trying and ask first.*
