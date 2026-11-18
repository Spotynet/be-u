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
| **Product** (auth, explore, booking, profile, feed) | Task completion | **Premium minimal** — airy, token-driven, quiet chrome |
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
| Inputs, CustomDropdown triggers, textareas | **10–12** (prefer `12`; dropdown popover **16**) |
| Cards / auth panels | **16–20** |
| Modals / sheets | 20–24 |
| **Buttons / chips / pills** | **full (`999`)** |
| Avatars | full |
| Icon wells | 12–14 |

### Elevation

- Prefer **hairline border** + soft shadow over heavy multi-layer shadows.
- Light: `cardShadow` ≈ soft sage-tinted shadow (never dramatic black drop shadows on forms).
- Avoid glow / neon. Dark mode: rely more on surface elevation than shadow.
- **Forms:** no glow under CTAs; at most a whisper of shadow on the card shell.

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
| `primary` | Yellow fill (`ctaYellow`) + ink text; **no heavy glow** | Main action: Continuar, Reservar, Empezar, Guardar |
| `secondary` | Forest / sage fill + light text | Strong alternative, not the page goal |
| `outline` | Transparent + hairline border | Cancel, secondary path |
| `ghost` | No fill | Tertiary, toolbar |
| `destructive` | Error fill or outline | Delete account, remove |

Sizes: `sm` | `md` | `lg`. Default `md`.  
Weight: **600–700** (not ultra-black 900).  
Loading: disable + spinner; keep label width stable.  
Do not nest buttons; one primary per card/section.

### Input / Field

**Premium minimal soft-fill** (canonical web: `nabbi-field` / `Input` · `Textarea` · `CustomDropdown`):

| State | Look |
|-------|------|
| Rest | Soft sage-tinted fill on page canvas; **no outer border**; radius **14**; height **52** |
| Hover | Slightly deeper sage tint |
| Focus | Card/white surface + **inset** sage outline (`1.5px`); never neon outer glow |
| Error | Soft error-tint fill + inset error outline; message in `error` color below |
| Disabled | 50% opacity |

Required anatomy:

1. Label (outside, **12** / medium, muted, slight tracking)
2. Control (soft fill as above; body **15** / weight 400)
3. Helper text **or** error (error replaces helper)
4. Never remove focus indication on web

Props (both platforms): `label?`, `error?`, `helperText?` (web), standard input attrs.

**Do not:** decorative icons inside fields, gray Bootstrap borders, blue focus rings, placeholder-only fields, duplicate labels outside the primitive.

### Dropdowns / Select

**Rule:** Never use the native `<select>` element or browser-native dropdown UI for choosing from a list. Always use the shared `CustomDropdown` component (`web/components/ui/CustomDropdown.tsx`) for a single value, or `CustomMultiSelect` when many values are allowed. Native dropdowns ignore the theme, break dark mode and look different across OS/browsers.

Shared internals live in `web/components/ui/dropdown/` (popover positioning/portal + auto-flip, lazy options, listbox keyboard, option row, search box, surface/sheet). Both select components must reuse these — do not fork positioning or lazy-load logic per screen.

#### Anatomy & tokens

| Part | Spec |
|------|------|
| Trigger | Same soft-fill tokens as `Input` (`nabbi-field__control`); sizes `md` ≈48 / `lg` ≈56; leading icon slot; trailing chevron rotates 180° when open; error/disabled/focus match fields |
| Popover | Portal to `document.body`; elevated surface (`--color-card` / dark `--nabbi-auth-surface`); 1px `--color-card-border`; radius **16**; `--shadow-dropdown`; padding **6**; width = trigger (min 220); `z-index` **15** (above cards/dock, below toasts ≈20) |
| Options | Height ≈44; radius **10–12**; hover/active = brand tint at low alpha; selected = stronger weight + check icon (Heroicons) on the right; optional description (muted); optional leading icon |
| Groups | Small uppercase muted label; sticky inside the scroll list |
| Motion | Open: scale 0.98→1 + fade, 140–160ms `--motion-ease-out`, origin from trigger side; exit ≈100ms; disabled under `prefers-reduced-motion` |
| Mobile | `< sm` / coarse pointer: bottom sheet (max-height **70dvh**, rounded top, drag handle, backdrop tap-to-close, safe-area padding) |

#### Behavior

- **Lazy loading:** static `options` render in chunks of `pageSize` (default **30**); IntersectionObserver sentinel (`rootMargin` ≈120px) appends the next chunk; search resets the chunk. Async `loadOptions` fetches page 1 on open / debounced search (250ms, abort stale); append while `hasMore`; skeleton rows + inline loading; error row with **Reintentar** (“No pudimos cargar las opciones. Inténtalo de nuevo.”).
- **Search:** `searchable="auto"` shows search when options > 8 or when `loadOptions` is used; accent-insensitive + case-insensitive over `label` + `keywords`; empty: “Sin resultados”.
- **Keyboard / ARIA:** combobox + listbox pattern (`role="combobox"` / `listbox` / `option`); Enter/Space/Arrows open; Arrow/Home/End/PageUp/PageDown; type-ahead (500ms buffer) when search is hidden; Escape closes and returns focus; Tab closes.
- **Form:** hidden `<input name>` for native submit; `forwardRef` / `focus()` for `focusFirstError`; `error` / `required` / `optionalLabel` / `clearable` / `disabled` via our validation (no native bubbles).

#### When to use

| Choice | Control |
|--------|---------|
| ≤ 3 mutually exclusive options with descriptions | Role cards / segmented control |
| 4+ options or long / async lists | **CustomDropdown** |
| Yes / no | Toggle / checkbox |

#### Examples

```tsx
<CustomDropdown
  label="País"
  name="country"
  value={country}
  onChange={(v) => setCountry(v)}
  options={COUNTRIES.map((c) => ({value: c.code, label: c.label}))}
  searchable="auto"
  required
/>

<CustomDropdown
  label="Cliente"
  value={clientId}
  onChange={(v) => setClientId(v)}
  loadOptions={async ({query, page, pageSize, signal}) => {
    const res = await fetchClients({query, page, pageSize, signal});
    return {options: res.items, hasMore: res.hasMore};
  }}
/>
```

#### Do not

- Native `<select>` / `<option>` / OS picker chrome
- Hardcoded hex/rgb in the component (tokens only)
- Emojis or flag emojis as option icons
- Per-screen custom menus that reinvent the same list picker

#### Multi-select

**Rule:** When a user can choose more than one value from a list, use `CustomMultiSelect` (`web/components/ui/CustomMultiSelect.tsx`). Never use `<select multiple>`, a row of checkboxes for long lists, or ad-hoc tag inputs.

| Part | Spec |
|------|------|
| Trigger | Same soft-fill tokens as inputs; **min-height** (chips may wrap to 2 rows, then `+N`); trailing chevron |
| Chips | Pill; brand-tint surface at low alpha; 1px border token; 12–13px semibold; optional icon; remove control ≥24px hit (`aria-label` “Quitar {label}”); enter animation 140ms (reduced-motion safe) |
| Popover rows | Leading rounded-square checkbox (brand fill + check when selected); stays **open** while selecting |
| Footer | Sticky: “N seleccionada(s)” + **Limpiar**; **Listo** closes. Mobile sheet: full-width **Listo (N)** + safe-area |
| Groups | Sticky uppercase muted headings (e.g. subcategories under parent category) |

**Behavior:** same lazy load + search rules as `CustomDropdown`; Space/Enter toggle and keep open; Backspace removes last chip; Escape closes; `aria-multiselectable` + live announcements; hidden `name[]` inputs; min/max with catalog messages.

**Dependent options:** child multi-select disabled until parent has ≥1 value (helper: “Elige primero una categoría.”). Removing a parent drops orphan children and shows a brief notice (“Quitamos {n} subcategorías de {categoría}.”), aria-live, auto-dismiss ~4s.

| Choice | Control |
|--------|---------|
| 1 value | **CustomDropdown** |
| Many values + long lists | **CustomMultiSelect** |
| ≤ 5 simple toggles | Checkbox group |
| Filters | Chips driven by multi-select |

```tsx
<CustomMultiSelect
  label="Categorías"
  name="categories"
  value={categories}
  onChange={(vals) => setCategories(vals)}
  options={MAIN_CATEGORIES.map((c) => ({value: c.id, label: c.name}))}
  searchable="auto"
  required
  min={1}
/>
```

**Do not:** `<select multiple>`; emojis; hardcoded colors; new per-screen tag inputs.

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

Forms are **premium minimal**: calm cream/forest surfaces, lots of air, one yellow CTA, almost no ornament.

### Visual principles

1. **Quiet chrome** — hairline borders, soft surfaces, no gradients inside the form panel, no field icons.
2. **Air over density** — field stack gap **20**; section gap **28–32**; avoid packing chips/alerts against the CTA.
3. **Type hierarchy** — one title (H1 ~28–32 / 700–800), one short subtitle (14–15 muted). Skip loud uppercase overlines when the title already says enough.
4. **Segmented choices** — role/type selectors are slim pills or segmented controls, not heavy card buttons.
5. **Feedback is restrained** — errors/success as short text with a left accent or soft tint; not thick boxed banners.
6. **One composition** — auth: brand mark (mobile) or quiet welcome panel (desktop) + form. No marquee, no floating badges.

### Structure

```
[Brand mark if needed]
[Screen title]
[Optional short description]

[Field]
[Field]
…
[Inline error / success — restrained]
[Primary CTA — full width on mobile]
[Secondary text link]
```

### Rules

1. **Labels always visible** — no placeholder-only fields.
2. Placeholders are examples (`ana@email.com`), not instructions.
3. Validate on blur + on submit; clear field error when the user edits.
4. API errors: map to fields when possible; otherwise one summary above the CTA.
5. Password: show/hide toggle; never block paste.
6. Primary submit = yellow CTA, full width on mobile; **no multi-shadow glow**.
7. Disable submit while in-flight; don’t clear the form on failure.
8. Auth screens reuse `AuthLayout` / brand treatment — don’t fork a new visual language per form.
9. Prefer native keyboard types (`email`, `tel`, `numeric`) and autofill attributes on web.
10. Required fields: indicate clearly; don’t rely on color alone.
11. Spanish copy; no em dashes or decorative separators in UI strings.
12. Prefer shared `components/ui` `Input` / `Button` / `CustomDropdown` before one-off styled controls.
13. Never use native `<select>` — always `CustomDropdown` / `CustomMultiSelect` (see **Dropdowns / Select**).

### Auth alignment

- Web: `AuthDualPanel` on `/login` and `/register` (same experience; URL syncs mode)
- Desktop: **one active form** + brand panel; sides swap (login = form|brand, register = brand|form). Never mount both forms at once.
- Mobile: one form; switch via inline text actions
- Shared forms: `LoginForm` / `RegisterForm` + `AuthLayout`
- Same CTA labels (“Empezar gratis”, “Iniciar sesión”); soft-fill fields; theme-aware canvas

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
- [ ] No native `<select>` — list pickers use `CustomDropdown` (themed popover / bottom sheet)

---

## 12. Implementation checklist (new UI)

1. Read this file + the platform standards doc.
2. Use existing `components/ui` primitives; extend them before adding one-off buttons.
3. Use semantic tokens — no new hex unless adding a documented primitive.
4. Match **primary = yellow CTA** grammar.
5. Mobile and web: same hierarchy, spacing rhythm, and copy for the same feature.
6. Marketing pages may be more expressive but must use brand palette and CTA rules.
7. Update this doc if you introduce a new token or component variant (PR description + this file).
8. Lists / selects: use `CustomDropdown` / `CustomMultiSelect` only — never native `<select>` (see **Dropdowns / Select**).

---

## 13. Doc map

| Document | Owns |
|----------|------|
| **`DESIGN_SYSTEM.md` (this file)** | Brand, tokens, type, components, forms, a11y |
| `web/FRONTEND_STANDARDS.md` | Next.js structure, features, TS patterns |
| `mobile/MOBILE_STANDARDS.md` | Expo structure, categories domain, RN patterns |
| `web/docs/THEME_SYSTEM.md` | How ThemeProvider / CSS variables work (implementation) |

---

**Last updated:** 2026-11-18 — Dropdowns + Multi-select (`CustomDropdown` / `CustomMultiSelect`); shared `web/components/ui/dropdown/` internals.
