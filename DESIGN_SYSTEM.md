# nabbi Design System

**Canonical UI source of truth for web (`web/`) and mobile (`mobile/`).**  
Platform coding docs (`web/FRONTEND_STANDARDS.md`, `mobile/MOBILE_STANDARDS.md`) cover architecture; **this file owns visual language, tokens, components, and forms**.

When web and mobile disagree, **this document wins**. Align code toward it; do not invent a third palette.

---

## 1. Product principles

nabbi is a calm, high-trust scheduling product (beauty, wellness, pets). UI should feel:

1. **Quiet luxury, not startup noise** — cream surfaces, sage greens, one yellow CTA. No purple gradients, neon glows, or generic “AI SaaS” chrome.
2. **One primary action per view** — yellow CTA for the thing that moves the user forward; everything else is secondary or ghost.
3. **Parity across surfaces** — a user who books on iPhone and later on nabbi.app should recognize the same brand, type rhythm, and button grammar.
4. **Tokens over hex** — never hardcode brand colors in feature UI. Use semantic tokens (`primary`, `accent` / CTA, `background`, `foreground`, …).
5. **Accessible by default** — WCAG AA for text on cream/white; 44×44 pt minimum hit targets; visible focus; Spanish copy by default for user-facing strings.

### Surfaces

| Surface | Role | Density |
|---------|------|---------|
| **Marketing** (landing, legal, contacto) | Brand story, conversion | Expressive, more motion, larger type |
| **Product** (auth, explore, booking, profile, feed) | Task completion | Tight, token-driven, shared components |
| **System** (errors, empty, loading) | Trust & recovery | Same tokens; clear hierarchy; no decorative clutter |

---

## 2. Brand palette (locked)

Named colors are **brand primitives**. Semantic tokens map to these.

| Token name | Hex | Role |
|------------|-----|------|
| **`primary` / sage** | **`#558367`** | **Brand primary green** — links, focus rings, chips, success tint (same hex in light and dark) |
| `ink` | `#12211A` | Near-black green — text on yellow CTA, footer (light) |
| `brandDark` / forest | `#1F3328` | Forest — hero bands, dark buttons, nav fills |
| `ctaYellow` | `#F6C531` | Yellow CTA fill only (not “primary” brand) |
| `gold` | `#D39932` | Soft accent — ratings, stats (not buttons) |
| `teal` | `#225D65` | Tertiary accent — rare highlights |
| `error` | `#C0392B` | Destructive / validation |
| `sageBright` | `#88B89A` | Primary-on-dark companion (muted text / borders in dark mode) |

### Page backgrounds (standard)

| Mode | Token | Hex | Usage |
|------|-------|-----|-------|
| **Light** | `bg` / `--color-background` | **`#FAF8F3`** (cream) | Default page / app canvas |
| **Light alt** | `bgAlt` | `#E3D8C6` (sand) | Alternating marketing sections |
| **Dark** | `bg` / `--color-background` | **`#0F1A14`** (forest night) | Default page / app canvas |
| **Dark alt** | `bgAlt` | `#2A4536` | Alternating marketing sections (must read clearly vs canvas) |
| **Dark band** | `forest` / `forestMid` | `#08140F` / `#143028` | Hero + FAQ dark bands (must not equal `bg`) |

Light and dark **must** keep `#558367` as primary green. Do not switch primary to blue/purple in dark mode.

**Do not use as brand identity:** purple, indigo, default blue SaaS, pure black `#000`, pure white-only flat UIs without cream (light) or forest (dark) atmosphere.

Product UI supports **`light` | `dark`** only (`ThemeProvider` / `ThemeModeSwitch`).

### Category accents (marketplace only)

Use for category chips/cards, not global chrome:

| Category | Feel | Example accents |
|----------|------|-----------------|
| Belleza | Soft rose | pink tints |
| Bienestar | Soft green | sage / mint |
| Mascotas | Soft amber | warm yellow |

Shared icons: `web/components/icons/CategoryIcons.tsx` and the mobile equivalent — keep labels and SVG language aligned.

---

## 3. Semantic token map (web ↔ mobile)

Implementations differ (CSS variables vs JS theme objects). **Meaning must match.**

| Intent | Web (CSS / Tailwind) | Mobile (`constants/theme.ts` / `colors.ts`) | Notes |
|--------|----------------------|-----------------------------------------------|-------|
| Page background | `--color-background` / `bg-background` | `bg` / `background` | **Light `#FAF8F3` / Dark `#0F1A14`** |
| Brand primary | `--color-primary` | `brandMuted` / keep sage | **`#558367` in both modes** |
| Surface / card | `--color-card` / `bg-card` | `surface` / `card` / `cardBg` | White (light) |
| Body text | `--color-foreground` | `foreground` / `textPrimary` | `ink` / `brandDark` |
| Secondary text | `--color-foreground-secondary` | `textSecondary` / `mutedForeground` | Must pass AA on cream |
| Muted text | `--color-foreground-muted` | `textTertiary` | Placeholders, captions |
| Brand green | `--color-primary` | `brandMuted` / `secondary` | Sage — links, focus, chips |
| Forest / dark fill | `--color-primary-dark` | `brandDark` / `primary` (light mode) | Nav, dark buttons |
| **Primary CTA** | `--color-secondary` + `secondary-foreground` | `ctaYellow` / `accent` + `ctaText` | Yellow + ink text |
| Teal accent | `--color-accent` | use sparingly / map if needed | Not for primary buttons |
| Border | `--color-border` / `input-border` | `border` / `inputBorder` | Sage-tinted |
| Error | `--color-error` | `error` / `destructive` | |
| Success | `--color-success` | `success` | Prefer sage, not neon green |
| Radius base | `--radius` ≈ `0.75rem` | inputs ~12; pills `999` | See §5 |
| Card shadow | `--shadow-card` | `cardShadow` | Soft, green-tinted |

### Known drift to fix (do not spread)

| Issue | Today | Target |
|-------|--------|--------|
| CTA semantics | Web `Button` `primary` = sage; mobile `Button` `primary` = yellow | **`primary` button variant = yellow CTA on both** |
| Web fonts | Geist (layout) | **Poppins** for product UI (match mobile) |
| Web dark theme | Was slate/blue | **Fixed:** forest `#0F1A14`, primary stays `#558367` |
| Extra themes | Removed (`blue` / `green` / `purple`) | **`light` / `dark` only** |
| Landing colors | Was hardcoded hex | Use `getSurfaces(mode)` + `ThemeModeSwitch` |

Source files:

- Web: `web/app/globals.css` (`:root` / `[data-theme="light"]`)
- Mobile: `mobile/constants/theme.ts`, `mobile/constants/colors.ts`

---

## 4. Typography

### Family

| Platform | Brand UI font | Status |
|----------|---------------|--------|
| Mobile | **Poppins** (`@expo-google-fonts/poppins`, 400–800) | ✅ Loaded in `app/_layout.tsx` |
| Web product | **Poppins** via `next/font/google` | 🔧 Target — replace Geist for product/auth/app shell |
| Web marketing | Poppins preferred; temporary Geist acceptable until migration | Migrate with product |

Monospace only for codes, IDs, debug — never for marketing headlines.

### Scale (product)

Use relative steps; exact px may vary slightly by platform.

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| Display | 32–40 | 800–900 | Rare; marketing heroes |
| H1 | 24–28 | 800 | Screen titles |
| H2 | 20–22 | 700–800 | Section titles |
| H3 | 17–18 | 700 | Card titles |
| Body | 15–16 | 400–500 | Default copy |
| Body sm | 13–14 | 400–500 | Secondary / helper |
| Caption | 11–12 | 500–600 | Labels, badges, overlines |
| Overline | 11–12 | 700–800 | Uppercase + tracking `0.06–0.08em` |

### Rules

- Headlines: tight tracking (`-0.02em` to `-0.04em`), high weight.
- Body: comfortable line-height `1.5–1.7`.
- Never mix more than **two weights** in a single small component (e.g. title + meta).
- User-facing product copy: **Spanish** unless the screen is explicitly bilingual.

---

## 5. Layout, spacing, radius, elevation

### Spacing scale

Prefer 4-based scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.

| Context | Guidance |
|---------|----------|
| Screen horizontal padding | 16 mobile / 24+ tablet |
| Stack between sections | 24–48 |
| Inside cards | 16–20 |
| Form field gap | 16 |
| Inline icon ↔ label | 8 |

### Radius

| Element | Radius |
|---------|--------|
| Inputs, selects | 12 |
| Cards | 16–20 |
| Modals / sheets | 20–24 |
| **Buttons / chips / pills** | **full (`999`)** |
| Avatars | full |
| Icon wells | 12–14 |

### Elevation

- Prefer border + soft shadow over heavy multi-layer shadows.
- Light: `cardShadow` ≈ soft sage-tinted shadow.
- Avoid glow / neon. Dark mode: rely more on surface elevation than shadow.

### Touch / hit targets

- Minimum **44×44** pt/px for interactive controls.
- Prefer full-width primary CTA on narrow mobile screens.

---

## 6. Component contracts

Shared **API shape** across platforms even if implementation differs. Put primitives in:

- Web: `web/components/ui/`
- Mobile: `mobile/components/ui/`

### Button

| Variant | Look | When |
|---------|------|------|
| `primary` | Yellow fill (`ctaYellow`) + ink text | Main action: Continuar, Reservar, Empezar, Guardar |
| `secondary` | Forest / sage fill + light text | Strong alternative, not the page goal |
| `outline` | Transparent + border | Cancel, secondary path |
| `ghost` | No fill | Tertiary, toolbar |
| `destructive` | Error fill or outline | Delete account, remove |

Sizes: `sm` | `md` | `lg`. Default `md`.  
Loading: disable + spinner; keep label width stable.  
Do not nest buttons; one primary per card/section.

### Input / Field

Required anatomy:

1. Label (outside, `14` / medium)
2. Control (min height ~44)
3. Helper text **or** error (error replaces helper; use `error` color)
4. Focus: sage/brand border + ring; never remove focus ring on web

Props (both platforms): `label?`, `error?`, `helperText?` (web), standard input attrs.

### Card

- Background: `card` / `surface`
- Border: subtle `border` OR soft shadow — pick one primary treatment per context
- Padding: 16–20
- No “card soup”: cards wrap **interactive or scannable units**, not every paragraph

### Chips / filters

- Idle: sage-tint bg + dark text
- Active: forest or yellow per nav context (match existing explore patterns; stay consistent within a screen)
- Category chips may use category accents

### Navigation

- Mobile tab bar: light surface; active = forest (light) / yellow (dark) per theme tokens
- Web app shell: same semantic colors; landing header may be cream sticky with yellow CTA

### Feedback

| State | Pattern |
|-------|---------|
| Loading | Inline spinner or skeleton in content area; avoid full-screen flash for small fetches |
| Empty | Short title + one sentence + optional CTA |
| Error | `error` / `errorBg`; recoverable actions (Reintentar) |
| Success | Toast or inline; sage success — not loud green banners |

---

## 7. Forms (web + mobile)

### Structure

```
[Screen title]
[Optional short description]

[Field]
[Field]
…
[Inline error summary if submit-level]
[Primary CTA]
[Secondary link/button]
```

### Rules

1. **Labels always visible** — no placeholder-only fields.
2. Placeholders are examples (`ana@email.com`), not instructions.
3. Validate on blur + on submit; clear field error when the user edits.
4. API errors: map to fields when possible; otherwise one summary above the CTA.
5. Password: show/hide toggle; never block paste.
6. Primary submit = yellow CTA, full width on mobile.
7. Disable submit while in-flight; don’t clear the form on failure.
8. Auth screens should reuse shared auth layout / brand header — don’t fork a new visual language per form.
9. Prefer native keyboard types (`email`, `tel`, `numeric`) and autofill attributes on web.
10. Required fields: indicate clearly; don’t rely on color alone.

### Auth alignment

- Web: `LoginForm` / `RegisterForm` + `AuthLayout` / `WelcomeSection`
- Mobile: register/login routes under `app/`
- Same order of fields, same CTA labels (“Empezar gratis”, “Iniciar sesión”), same brand mark treatment

---

## 8. Motion

| Use | Guidance |
|-----|----------|
| Micro | 150–200ms ease for hover/press opacity |
| Expand (FAQ, accordion) | ~300–350ms |
| Marketing float | Slow, subtle; desktop-only if distracting on mobile |
| Page transitions | Prefer platform defaults; no gratuitous parallax in product |

Respect `prefers-reduced-motion` on web; avoid continuous animation for essential content.

---

## 9. Iconography & imagery

- Prefer **Heroicons** (web) / existing vector set (mobile) — consistent stroke weight.
- Category artwork: shared `getCatIcon` language.
- App mark: `/nabbi_logo_t.png` (web) and mobile assets — keep clear space; don’t recolor ad-hoc.
- Photos: real service atmosphere when used; avoid generic stock collage in hero.

---

## 10. Content & voice

- Spanish, second person, clear and warm — not corporate filler.
- Buttons: verb-first (“Reservar”, “Guardar cambios”, “Empezar gratis”).
- Errors: say what happened + what to do (“No pudimos guardar. Revisa tu conexión e inténtalo de nuevo.”).
- Legal links: use real routes (`/aviso-de-privacidad`, `/terminos-y-condiciones`, `/contacto`) — no `#` placeholders in shipping UI.

---

## 11. Accessibility checklist

- [ ] Text contrast ≥ WCAG AA on cream and on yellow CTA (ink on yellow)
- [ ] Focus visible on all interactive web controls
- [ ] Hit target ≥ 44×44
- [ ] Images/icons that convey meaning have labels / `accessibilityLabel`
- [ ] Form errors announced (web: associate `aria-describedby`; mobile: accessible text)
- [ ] Don’t convey state by color alone
- [ ] Dark mode tokens remain on-brand (forest), not generic slate/blue

---

## 12. Implementation checklist (new UI)

1. Read this file + the platform standards doc.
2. Use existing `components/ui` primitives; extend them before adding one-off buttons.
3. Use semantic tokens — no new hex unless adding a documented primitive.
4. Match **primary = yellow CTA** grammar.
5. Mobile and web: same hierarchy, spacing rhythm, and copy for the same feature.
6. Marketing pages may be more expressive but must use brand palette and CTA rules.
7. Update this doc if you introduce a new token or component variant (PR description + this file).

---

## 13. Doc map

| Document | Owns |
|----------|------|
| **`DESIGN_SYSTEM.md` (this file)** | Brand, tokens, type, components, forms, a11y |
| `web/FRONTEND_STANDARDS.md` | Next.js structure, features, TS patterns |
| `mobile/MOBILE_STANDARDS.md` | Expo structure, categories domain, RN patterns |
| `web/docs/THEME_SYSTEM.md` | How ThemeProvider / CSS variables work (implementation) |

---

**Last updated:** 2026-11-17 — established as cross-platform source of truth; documents current token drift and target state.
