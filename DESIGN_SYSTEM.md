# nabbi Design System

**Canonical UI source of truth for web (`web/`) and mobile (`mobile/`).**  
Platform coding docs (`web/FRONTEND_STANDARDS.md`, `mobile/MOBILE_STANDARDS.md`) cover architecture; **this file owns visual language, tokens, components, and forms**.

When web and mobile disagree, **this document wins**. Align code toward it; do not invent a third palette.

### Tabla de contenidos

1. [Product principles](#1-product-principles)
2. [Brand palette (locked)](#2-brand-palette-locked)
3. [Semantic token map](#3-semantic-token-map-web--mobile)
4. [Typography](#4-typography)
5. [Layout, spacing, radius, elevation](#5-layout-spacing-radius-elevation)
6. [Component contracts](#6-component-contracts) · [6b App Shell](#6b-app-shell) · [6c Navegación](#6c-navegación) · [6d Componentes base](#6d-componentes-base) · [6e Header chrome](#6e-header-chrome-authenticated) · [6f Explorar](#6f-explorar-y-filtros)
7. [Forms](#7-forms-web--mobile)
8. [Motion](#8-motion)
9. [Iconography](#9-iconography--imagery)
10. [Content & voice](#10-content--voice)
11. [Accessibility](#11-accessibility-checklist)
12. [Implementation checklist](#12-implementation-checklist-new-ui)
13. [Doc map](#13-doc-map)
14. [Estado de implementación y deuda](#14-estado-de-implementación-y-deuda-de-ui-conocida)
15. [Registro de cambios](#15-registro-de-cambios-changelog)

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
| **Light frame** | `--shell-frame-*` | `#1F3328` / `#2A4638` | Dark-green sidebar frame (light only) |
| **Dark frame** | `--bg-frame` | **`#0C0D0D`** | Near-black app frame / sidebar |
| **Dark panel** | `--surface-panel` / `--nabbi-bg` | **`#121413`** | Center + Centro social panels |
| **Dark card** | `--surface-card` / `--nabbi-card` | **`#191B1A`** | Cards, inputs |
| **Dark raised** | `--surface-raised` | **`#212423`** | Menus, popovers, floating sidebar |
| **Dark hover** | `--surface-hover` | **`#292C2B`** | Row/card hover |

### Dark theme principles (2026-11-24)

1. **Near-black base** — no green page/frame backgrounds in dark; green is accent only.
2. **Elevation by lightness** — frame → panel → card → raised → hover (each step lighter).
3. **Off-white text** — `#ECEEED` / `#A9AEAB` / `#8E9390` (never pure `#FFF`).
4. **Green accent** — fill `#1F3328`, text/icon `#8CC4A0`, border sage `@45%`; never color-only state.
5. **Yellow CTA unchanged** — `#F6C531` + `#12211A`.
6. **No pure `#000` surfaces** (scrims excepted); **no pure `#FFF` text**.

Light theme values (including the dark-green sidebar frame) are **unchanged**.

Product UI supports **`light` | `dark` | `system`** (`ThemeProvider` / Apariencia).

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
| Page / panel bg | `--surface-panel` / `--nabbi-bg` | `bg` | Light cream / Dark `#121413` |
| Frame | `--bg-frame` / `--shell-frame-mid` | — | Light forest / Dark `#0C0D0D` |
| Card | `--surface-card` / `--nabbi-card` | `card` | Light white / Dark `#191B1A` |
| Raised | `--surface-raised` | — | Popovers; Dark `#212423` |
| Body text | `--nabbi-fg` | `textPrimary` | Light ink / Dark `#ECEEED` |
| Secondary / muted | `--nabbi-fg-secondary` / `--nabbi-fg-muted` | | Dark `#A9AEAB` / `#8E9390` |
| Accent text | `--accent-text` / `--nabbi-primary` (dark) | | Dark `#8CC4A0` |
| Accent fill | `--accent-fill` / `--nabbi-primary-light` (dark) | | Dark `#1F3328` |
| Brand green (light) | `--nabbi-primary` | `brandMuted` | Light `#558367` unchanged |
| **Primary CTA** | `--nabbi-secondary` + fg | `ctaYellow` | Yellow + ink — both themes |
| Hairline | `--hairline` / `--hairline-strong` | | White @ 8% / 14% (dark) |
| Status | error / warning / success | | Dark readable on card; wash @ 14% |
| Radius / shadows | `--r-*` / `--shadow-panel` | | Dark shadows = black alpha only |

### Dark contrast (WCAG 2.x)

| Pair | Ratio |
|------|-------|
| text-primary on panel / card / raised | 15.9 / 14.9 / 13.4 |
| text-secondary on panel / raised | 8.2 / 7.0 |
| text-tertiary on panel / raised | 5.9 / 5.0 |
| accent-text on panel / card / raised / fill | 9.3 / 8.7 / 7.8 / 6.7 |
| text-primary on accent-fill | 11.5 |
| yellow on panel / CTA text on yellow | 11.4 / 10.3 |

`accent-fill` vs panel ≈ 1.4:1 — fill only; pair with accent-text / border / icon.

### Known drift to fix (do not spread)

| Issue | Today | Target |
|-------|--------|--------|
| CTA semantics | Web `Button` `primary` = sage; mobile `Button` `primary` = yellow | **`primary` button variant = yellow CTA on both** |
| Web fonts | Geist (layout) | **Poppins** for product UI (match mobile) |
| Web dark theme | Was forest green canvas | **Neutral near-black + green accent (2026-11-24)** |
| Extra themes | Removed extras | **`light` / `dark` / `system`** |
| Landing colors | Was hardcoded hex | Use tokens + `ThemeModeSwitch` |

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
| H1 | 28–30 | 600 | PageHeader screen titles (28 mobile / 30 desktop) |
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
| Screen horizontal padding | 4 mobile / 8 tablet / 12+ desktop |
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

- Mobile tab bar: light surface; active = yellow CTA label (see **Navegación** below)
- Web app shell: see **App Shell** + **Navegación**
- Landing header may be cream sticky with yellow CTA

### Feedback

| State | Pattern |
|-------|---------|
| Loading | Inline spinner or skeleton in content area; avoid full-screen flash for small fetches |
| Empty | Short title + one sentence + optional CTA (`EmptyState`) |
| Error | `error` / `errorBg`; recoverable actions (Reintentar) |
| Success | Toast or inline; sage success — not loud green banners |

---

## 6b. App Shell

**Rule:** Todas las pantallas autenticadas usan AppShell; no crear headers, frames o sidebars por pantalla. El chrome vive en `web/components/shell/` + plantillas en `web/components/layout/`.

Canonical: `AppShell`, `BreadcrumbBar`/`PanelTopbar`, `MobileChromeHeader`, `Sidebar/*`, `Rail/*` (Centro social), `nav-config.ts`, `rail-config.ts`, `shell-config.ts`, `usePageHeader.tsx`, layout templates T1–T5.

### Anatomía 3 columnas (≥ 1180px)

```
frame (dark green, 100dvh, no scroll)  padding --shell-gap
  grid: var(--sidebar-w) | minmax(0,1fr) | var(--social-rail-w)
  ├─ <nav aria-label="Principal"> Sidebar
  │     [lockup+pin] [divider] [PROFILE CARD] [NAV] [VISITADOS RECIENTEMENTE]
  ├─ <main id="contenido-principal"> CENTER PANEL (cream, radius 28)
  │     BreadcrumbBar sticky (--bar-h) → PageContainer → T1–T5
  └─ <aside aria-label="Centro social"> SOCIAL PANEL (cream, radius 28, scroll propio)
data-rail = open | closed | drawer; skip link "Saltar al contenido"
Sticky offsets: --sticky-offset (= --bar-h + --shell-gap)
```

### Layout tokens

| Token | Valor | Uso |
|-------|-------|-----|
| `--shell-radius` / `--panel-radius` | 28px | Paneles flotantes |
| `--shell-gap` | 12px | Insets + column gap |
| `--sidebar-w` | 272 / 76 | Expanded / rail (modo existente) |
| `--social-rail-w` / `--rail-w` | 340 / 380 / 0 | ≥1180 / ≥1760 / cerrado |
| `--bar-h` | 64px | Panel topbar |
| `--filter-bar-h` | 56px | Explorar FilterBar |
| `--sticky-offset` | bar-h + shell-gap (shell); explore scopes bar+filter+12 | Sticky unificado |
| `--page-pad` / `--page-max` / `--card-*` | (sin cambio) | Contenido |

### Rail policy (única fuente: `rail-config.ts`)

| Política | Rutas |
|----------|-------|
| **hidden** (opt-out) | `/explore`, `/notification-preferences`, `/booking`, `/posts/create`, `/delete-account`, `/calendar/callback`, `/dashboard` |
| **visible** | resto autenticado |

`/explore` opt-out: Centro social no se docket (ni mini); campana / toggle abren drawer. Justificación: el split lista+mapa necesita el ancho de la columna central (~992px a 1280 con rail oculto vs ~640 con rail 340).

### Estados del Centro social (A/B/C/D)

| Estado | `--rail-w` | Cuándo |
|--------|------------|--------|
| **A open** | 340 / 380 (≥1760) | ≥1280 + preferencia `open` |
| **B mini** | 64 | ≥1280 preferencia `mini`; default 1024–1279 |
| **C overlay** | columna sigue 64; panel float 340 | 1024–1279 al expandir (no modal) |
| **D drawer/sheet** | 0 | &lt;1024 o rutas opt-out; sheet &lt;640 = `100vw - 12px` |
| **hidden** | 0 | opt-out sin drawer abierto |

Preferencia persistida: `nabbi:rail:v2` = `open` \| `mini` (migrar v1: open→open, closed→mini; borrar v1). **Nunca** persistir overlay/drawer.

Mini rail: expand chevron + iconos de secciones con badge; click → A o C + focus sección. Edge handle 40×112 (768–1023). Toggle topbar ≥1024; &lt;1024 solo bell (+ edge).

A11y: `#centro-social`; C Esc/outside/focus return; D `role=dialog` modal + trap + body lock; `aria-live` al subir unread colapsado (máx 1/30s). Motion 220ms grid / 160ms fade; reduced-motion = instant. z: float 48 &lt; drawer/overlay 50–60.

### Sidebar (estructura)

1. Lockup + pin; divider.
2. **Profile card** (sustituye user block inferior): superficie translúcida, avatar + nombre + rol + chevron → UserMenu existente; rail = avatar + tooltip.
3. Nav links (connected-tab, badges solo con datos reales).
4. **Visitados recientemente**: max 6; `useRecentVisits` → `nabbi:recent-visits:v1:<userId>`; Limpiar + toast; vacío con copy; rail = avatars; se limpia en logout. `recordVisit` en perfil público.

### Centro social (widgets solo con datos reales)

| Sección | Fuente | Omitir si |
|---------|--------|-----------|
| Próximas reservas | `reservationApi.getMyReservations(upcoming)` | vacío |
| Notificaciones | `NotificationsProvider` (mark-all existe) | — (empty copy) |
| Sugeridos para ti | `providerApi.getRecommendations` / listado | error/vacío |
| Chats / stories / eventos | — | **no existen** |
| Actividad social separada | tipos `social` en notifs | fusionada en Notificaciones |

`SocialCenterProvider`: reservas + sugerencias; notificaciones vía provider existente (sin poll duplicado de unread). Poll lista 60s solo con rail/drawer abierto + `visibilityState=visible`.

### Breadcrumb bar
Izquierda trail; derecha search + location + **SocialBell** + **RailToggle**. Sin avatar (perfil en sidebar). Mobile: `[menú][título][search][bell]`.

### Contenido: container queries
El centro es más estrecho que el viewport (~600–1150px). Layouts de página usan `@container` / `@min-[…]` — **no** `sm:`/`md:`/`lg:` para grids de contenido. Shell puede seguir con viewport MQ.

### PageHeaderRow
Título compacto (~30px) + meta chips opcionales + descripción 1 línea opcional + actions a la derecha (wrap &lt;640). Sin eyebrow. Sustituye `PageHeader` legacy.

### Card system
- **CardHeader**: icono circular 36 (tint brand) + título 16 semibold + línea secundaria 13 + 0–3 IconButton 32 o “Ver todo”.
- **Card**: `--card-radius`, hairline, shadow-card, `--card-pad`; tiles `--tile-radius`.
- **IconButton**, **StatTile**, **DetailList** (icono · label/value · acción).

### Plantillas (una página = una plantilla)
| Id | Componente | Diagrama |
|----|------------|----------|
| T1 | `StackLayout` | `[Header] / [Card] / [Card]…` |
| T2 | `MainRailLayout` | `[Main 1fr | Rail 320/360]` ≥1280 CQ; abajo rail apila (o `--drawer-rail` lo oculta + Filter sheet) |
| T3 | `BentoGrid` | 12 col ≥1280 / 6 col 768–1279 / 1 col &lt;768; spans 12/8+4/6+6/4+4+4; último huérfano llena fila |
| T4 | `ToolbarListCard` | Card: toolbar (título+Filter) → ChipRow → filas |
| T5 | `TabsGridLayout` | Tabs + SettingsSectionGrid |

**Reglas:** una página = una plantilla; colores y tipografías no cambian con el layout; no inventar widgets de rail; `PageContainer` estándar (sin `size`); tokens only / clases estáticas.

### Mapa página → plantilla
| Ruta | T | Notas |
|------|---|-------|
| /explore | T1 | FilterBar sticky + split lista/mapa; rail **hidden** (opt-out) |
| /feed | T1 | Filtros/categorías in-page; shell owns right column |
| /reservations, /favorites, /notifications | T4⊂T1 | |
| /me | T3 | |
| /notification-preferences | T5 | rail **hidden** |
| /booking | T2 in-page | rail **hidden** |
| /profile/[id] | T2 | summary panel |
| Resto | T1 | |
| /dashboard | — | follow-up |

### Responsive matrix (shell polish)
| Viewport | Sidebar mode / w | Rail state / w | Center ~ | Page pad | Explore cols |
|----------|------------------|----------------|----------|----------|--------------|
| 2560 | pinned 264 | open 380 | capped `--page-max` | 20 | 3 |
| 1920 | pinned 264 | open 380 | ~1232 | 20 | 3 |
| 1760 | pinned 264 | open 380 | ~1072 | 20 | 3 |
| 1440 | pinned 264 | open 340 | ~800 | 20 | 2–3 |
| 1280 | pinned/rail | open 340 | ~640–832 | 20 | 2 |
| 1180 | rail 72 | open 340 | ~744 | 12 | 2 |
| 1024 | rail 72 | mini/drawer | ~916 | 12 | 1–2 |
| 768 | drawer | drawer | full −8 | 8 | 1 |
| 390 | drawer | drawer | full −4 | 4 | 1 |

Heights 600 / 720 / 900: profile card compacts &lt;720; nav items 40px; recents scrolls after 3 rows.

Canonical: `AppShell`, `Rail/*`, `BreadcrumbBar`, `Sidebar/*`, `rail-config.ts`, `web/components/layout/*`.

### Reglas obligatorias del shell (código = verdad)

| Regla | Dónde |
|-------|-------|
| Tokens only — no hex en feature/shell UI | `globals.css` + clases Tailwind semánticas |
| Copy en español; sin emojis; iconos de `@heroicons/react` | Componentes shell |
| Un solo control de cada tipo: búsqueda, ubicación, avisos, entrada de usuario, pin | Ver tabla one-of-each abajo |
| Un overlay abierto a la vez; un owner por id | `overlay/OverlayProvider.tsx` |
| Nunca ocultar con CSS un owner que porta un portal | `useMediaQuery(SHELL_LG_MQ)` + mounts condicionales en `AppShell` |
| Focus: `focus-visible`; anillo **amarillo** (`ring-secondary`) en chrome oscuro / TopbarButton; anillo **brand-green** (`ring-primary`) en superficies claras del panel (filas de avisos, campos) | Tokens + componentes |
| `prefers-reduced-motion` — sin animación de width / ring / badge pop | `globals.css` + clases `motion-reduce:*` |

### Capas (desktop ≥ lg)

```
frame (--shell-frame-bg, 100dvh, no scroll; gap 12 ≥1024 / 8 <1024)
  ├─ Sidebar dock (264 pinned | 72 rail) — dark-frame chrome
  │    └─ peek float 264 (z-peek 45) when unpinned + hover/focus — panel does NOT shift
  ├─ Center panel (--r-panel 28, hairline + shadow-panel + inset highlight)
  │    ├─ PanelTopbar sticky 64px (borderless → glass on scroll)
  │    └─ .nabbi-shell-panel__scroll → page pad 16/24/32
  └─ Centro social (same panel surface; 340 / 380≥1760 / mini 64)
Overlays → #overlay-root (z 60); toasts z 70
```

### Flag: `CLIENT_USES_SIDEBAR`

`web/components/shell/shell-config.ts` → `export const CLIENT_USES_SIDEBAR = true`.

| Value | CLIENT desktop |
|-------|----------------|
| `true` | Sidebar on the frame + in-panel Topbar (same as PRO/PLACE). Primary nav lives in the sidebar; `ClientFrameBar` is **not** rendered on lg+. |
| `false` | Dark `ClientFrameBar` with soft nav pills; **no** sidebar. |

Both paths must remain valid. Flip the constant to switch.

### Frame + Panel anatomy (desktop ≥ lg)

| Token / piece | Spec |
|---------------|------|
| Frame | Full viewport `100dvh`, **does not scroll**. **Single paint:** `background-color: --shell-frame-mid` + `background-image: --shell-frame-bg` (highlight → vignette → linear). Sidebar/header/nav are **transparent**. Peek/drawer reuse `--shell-frame-bg` with `background-attachment: fixed` (viewport-aligned). Tokens: `--shell-frame-from/to/mid`, `--shell-frame-bg`, `--shell-panel-*`. |
| Panel | Inset surface: page bg (light) / neutral dark (dark). Radius 24 / 28 xl. Inset 12px. Border + soft shadow. **No green fills inside the panel.** |
| Scroll | Only `.nabbi-shell-panel__scroll.scroll-premium`. Route change → scrollTop 0. |
| Content column | `.nabbi-shell-container` = `max-w-7xl` + `px-6` / `lg:px-8`. |
| `--sidebar-w` | CSS var on the shell root (**272 pinned / 76 unpinned**). Set from pin state only — **never** changes on peek. Transition `220ms cubic-bezier(.2,.8,.2,1)`. |

### Header variants

| Role / flag | Desktop header |
|-------------|----------------|
| CLIENT + `CLIENT_USES_SIDEBAR=false` | Dark `ClientFrameBar` (h-16), soft pills, no sidebar / no panel topbar |
| CLIENT + `CLIENT_USES_SIDEBAR=true` | Sidebar + `PanelTopbar` (same as PRO/PLACE) |
| PROFESSIONAL / PLACE | Sidebar + `PanelTopbar` |
| All &lt; lg | Frame removed; mobile header 56px + burger drawer; **no** bottom nav (`SHOW_MOBILE_BOTTOM_NAV=false`) |

### One-of-each rule (no chrome duplicates)

| Element | lg+ with sidebar | &lt; lg |
|---------|------------------|--------|
| User entry | `ProfileHero` / `SidebarProfileCard` (Topbar has **no** avatar) | Drawer `ProfileHero` only (**no** avatar in mobile header) |
| Pin / menu | Pin button in sidebar header (hover/focus) | Burger opens drawer; pin **not** shown in drawer |
| Page title (h1) | Page `PageHeader` owns it | same |
| Location | Single `LocationPill` in Topbar | Drawer `LocationPill` compact |
| CTA destination | At most one control per href | — |

Theme stays **inside** `UserMenu` (no separate Topbar ThemeToggle).

### Panel Topbar (premium)

- Height **72px**, sticky; panel surface @ **80%** + `backdrop-blur-md`; divider fades in after scroll (IO, 150ms).
- Same `.nabbi-shell-container` padding/max-width as page content.
- **Left:** empty by default. When the active page uses `PageHeader variant="compact"` and that header scrolls out, a **condensed title** (15px semibold, `aria-hidden`) fades in from context — see PageHeader. Optional fallback h1 only via `usePageHeader` exception below. `min-w-0` so right controls never wrap. Hide condensed title if the title slot &lt; 160px.
- **Right** (groups `gap-3`, within-group `gap-2`, 1px divider h-5): Search · | · LocationPill + NotificationsBell. Optional `actions`. **No avatar.**
- All controls share `TopbarButton` tokens: h-44, `rounded-full`, `bg-card` + `border-card-border`, hover border brand-tint, focus-visible yellow (`secondary`) ring. Search = inline `SearchBar` input (not a palette trigger): resting 240px lg / 280px xl; **grows leftwards** over free space on focus (slot + absolute); LocationPill and Bell **never** compact for search.
- **No breadcrumbs** in the Topbar or mobile header.
- First focusable in the shell: skip link **“Saltar al contenido”** → `#contenido-principal` (`<main id="contenido-principal" tabIndex={-1}>`).

### Z-index layers (shell)

| Token / class | Value | Layer |
|---------------|-------|-------|
| `--z-shell-sticky` / `.z-shell-sticky` | 30 | Sticky panel Topbar |
| `--z-shell-chrome` / `.z-shell-chrome` | 40 | Mobile header, frame bar |
| `--z-shell-peek` / `.z-shell-peek` | 45 | Unpinned floating sidebar peek |
| `--z-shell-drawer` / `.z-shell-drawer` | 50 | Sidebar drawer |
| `--z-shell-overlay` / `.z-shell-overlay` | 60 | HeaderPopover / sheets / menus |
| `--z-shell-toast` / `.z-shell-toast` | 70 | Toasts |

Stack order: panel content < sticky topbar < chrome < **peek** < drawer < popovers/sheets < toasts. No magic `z-[N]` in shell chrome.

### Overlays

Canonical: `web/components/shell/overlay/` (`OverlayProvider`, `useOverlay(id)`, `useMediaQuery`, `#overlay-root`) + `HeaderPopover`.

| Rule | Spec |
|------|------|
| Portal root | Single `#overlay-root` created once (AppShell / OverlayProvider). Shell popovers/sheets portal **here** — not ad-hoc `document.body` per instance |
| One open | Only one of `notifications` \| `location` \| `user-menu` \| `drawer` open at a time; opening another closes the current |
| One owner / id | `useOverlay(id)` registers a single owner; a second mount with the same id is ignored + `console.warn("Duplicate overlay owner: …")` in dev. Render the portal **only** when `isOwner` |
| Esc | Closes the topmost (active) overlay only |
| Outside click | Closes current unless the click is on its own trigger (trigger toggles) |
| Route change | `closeAll` |
| Resize across `lg` | `closeAll` (and close drawer). Constant: `SHELL_LG_MQ` / `SHELL_LG_PX` (=1024) from `shell-config` |
| Breakpoint mounts | **No montar dos instancias de un overlay; render condicional por breakpoint, nunca ocultar con CSS un componente con portal.** `useMediaQuery(SHELL_LG_MQ)` returns `null` until measured — mount Topbar owners only when `true`, mobile-header / drawer owners only when `false` |
| Anchor validation | If the anchor is missing, disconnected, `display:none`, or has a zero-size rect → **do not render** the popover; call `onClose`; never default to `(0,0)`. Hide until the first valid `useLayoutEffect` measurement |
| Focus | `:focus-visible` only. Pointer open → focus the dialog container (`tabIndex={-1}`, no ring). Keyboard open → brand-green ring (`ring-primary`) on the first unread / first item. **Never** yellow CTA ring on light surfaces |
| StrictMode | Owner claim/release and portal-root creation are idempotent; listeners clean up |

**Do not:** CSS-hide (`hidden` / `lg:hidden`) a second bell/pill/menu that still mounts a portal; share a bare boolean `open` across two portal owners; paint a popover at `(0,0)` for a zero-rect anchor; yellow focus rings on list rows.

### Breakpoints (shell)

| Token | Width | Shell behavior |
|-------|-------|----------------|
| `lg` | ≥1024px (`SHELL_LG_PX`) | Desktop Sidebar vs burger drawer; PanelTopbar vs mobile header; default **unpinned** if no cookie |
| `xl` | ≥1280px | Default **pinned** if no cookie; Location pill label+chip; SearchBar resting 280px; panel radius xl |
| Sheets | ≤639px **or** coarse pointer | `HeaderPopover` / dropdowns use bottom sheet (`isCoarseOrNarrowViewport`) — independent of `lg` |

All shell `matchMedia` checks use **`SHELL_LG_MQ`** aligned with Tailwind `lg`. Desktop Sidebar and drawer are **never both mounted**.

### Keyboard shortcuts (shell)

| Shortcut | Handler | Notes |
|----------|---------|-------|
| Ctrl/Cmd+K, `/` | `SearchChromeProvider` (one) | Focus SearchBar; ignore when typing elsewhere |
| `[` | `useSidebarState` (one) | Toggle **pin** on lg+; live region “Menú fijado” / “Menú sin fijar” |
| Esc | Peek / overlay | Closes peek first (if open); else topmost popover/sheet/drawer |

### Checklist de QA del shell

Run before release at **360 / 390 / 768 / 1024 / 1100 / 1280 / 1440 / 1920**, light + dark, roles CLIENT / PROFESSIONAL / PLACE:

1. Skip link is first Tab → `#contenido-principal`.
2. Topbar: Search / Location / Bell share h-44 + `rounded-full`; divider between Search and Location+Bell.
3. Search focus **grows leftwards** (slot + absolute); LocationPill and Bell **do not** change size; title/nav fades; no overlap with sidebar.
4. Open Location → open Bell → Location closes (mutual exclusion); Esc returns focus to trigger; resize across 1024 closes overlays.
5. Exactly one popover instance (no duplicate at top-left).
6. Drawer at 390 via burger; safe-area; body scroll unlocks on close; **no** bottom nav.
7. Unread count matches bell, sidebar badge, and `(n)` title prefix; badge clears the bell glyph.
8. Badge corner geometry OK; pin reload no width flash (`nabbi_sidebar=pinned\|unpinned`).
9. Unpinned peek: hover rail → float 272 over content **without** panel shift; leave closes after 220ms; Esc closes.
10. Keyboard-only: Tab into rail peeks; `[` toggles pin; Enter/Space on bell; Esc.
11. Offline / error / empty states for avisos and Explorar.
12. Reduced-motion: no sidebar width / search width / badge pop / bar grow animation.

### `usePageHeader` contract

```ts
usePageHeader({ title?, pageOwnsTitle?, actions? })
// label? deprecated — section from routeLabels / nav-config only
```

- Route defaults → `pageOwnsTitle: true` + title from `nav-config` / `ACCOUNT_ROUTES`. Topbar **never** prints a competing h1 by default.
- Pages with `PageHeader` keep ownership of the h1; condensed topbar title shares the same resolved `title`.
- **EXCEPTION:** `usePageHeader({ title, pageOwnsTitle: false })` — Topbar renders the fallback h1 when the page has no PageHeader. Documented in code.

### Sidebar (pin model)

Canonical: `web/components/shell/Sidebar/` — `Sidebar`, `SidebarSection`, `SidebarItem`, `SidebarGroup`, `SidebarPinButton`, `SidebarPinIcon`, `SidebarProfileCard` / `profile/ProfileHero`, `SidebarSkeleton`, `useSidebarState`, `useSidebarPeek`, `useNavGroups`.

```
PINNED (lg+):     [dock 272] | panel…          --sidebar-w=272
UNPINNED rail:    [rail 76]  | panel…          --sidebar-w=76 (stable)
UNPINNED + peek:  [rail 76] + float 272 overlay over panel (z-peek 45); panel does NOT resize
< lg:             burger → drawer min(86vw,320); no pin; no bottom nav
```

#### State table

| Mode | `--sidebar-w` | Chrome | How |
|------|---------------|--------|-----|
| **Pinned** | 272 | Docked full labels | Cookie `pinned` / `[` / pin button |
| **Unpinned rail** | 72 | Icons + tooltips | Cookie `unpinned`; pin outline @ 45° |
| **Peek (float)** | **still 72** | Full 264 overlay, radius `--r-panel`, `--shadow-float`, hairline-dark border, glass blur | Pointer hover (delay **120ms** open / **220ms** close) or keyboard focus; touch never peeks |
| **Drawer** | n/a | Full nav + user + LocationPill | Burger / edge-swipe; pin hidden |

Peek closes: pointer leave (delayed), Esc (restore focus), route change, blur out of sidebar, another overlay opens. Timers cleaned up. Peek state is **local to Sidebar** (does not re-render the panel).

#### Modos del Sidebar (`data-sidebar-mode`)

Single attribute on the sidebar root (`aside`): `expanded` | `collapsed` | `floating` | `mobile`. All mode-specific CSS keys off this; no parallel flags.

| Mode | Attr | Active shape | Indicator | Geometry |
|------|------|--------------|-----------|----------|
| **Expanded** (pinned) | `expanded` | Glass-2 pill + yellow edge indicator | Shared sliding bar | Width 264; items h-44, radius `--r-tile`; no icon tiles |
| **Collapsed** (rail) | `collapsed` | Glass-2 + indicator | Shared | 48×48 centered; tooltips right |
| **Floating** (peek) | `floating` | Same glass pill | Shared | Card 264, `--r-panel`, `--shadow-float`, blur 16px when supported |
| **Mobile** (drawer) | `mobile` | Same glass pill | Shared | `min(320px, 86vw)`, radius `0 --r-panel --r-panel 0` |

**Deprecated:** connected-tab / concave notch / cream connector into the center panel — **removed**. Panels float with a gap; active state is glass + sliding indicator only.

#### Modo flotante (peek overlay)

| Spec | Value |
|------|-------|
| Mount | Float card **always mounted** while unpinned; rail chrome underneath. Visibility via `data-open="true\|false"` (never unmount to hide). |
| Card | Width 264 (`--sidebar-float-w`); radius `--r-panel`; hairline-dark + `--shadow-float`; backdrop blur 16px when `@supports` and not reduced-transparency. |
| Open / close intent | Hover dwell **120ms** open / **220ms** close; focus opens immediate; Esc closes; touch never peeks. |
| Open motion | **180ms** translateX(-8px) + opacity. |
| Reduced motion | Instant; no translate. |

#### Dimensions & motion

| Token / value | Spec | Where |
|---------------|------|-------|
| Expanded / peek width | **264px** | `SIDEBAR_WIDTH_EXPANDED` |
| Rail width | **72px** | `SIDEBAR_WIDTH_RAIL` |
| Width / pin transition | **220ms** `cubic-bezier(.2,.8,.2,1)` | `--sidebar-ease`, `--sidebar-width-ms` |
| Peek open / close delay | **120ms** / **220ms** | `SIDEBAR_PEEK_*_DELAY_MS` |
| Reduced motion | Instant width; no indicator transition | `prefers-reduced-motion` |

#### Header (h-72, px-16)

| Piece | Spec |
|-------|------|
| Left | **BrandLockup** — mark **27** + word **17** (`--brand-scale: 0.85` on bases 32/20), `--brand-gap` **5px**, no tile/slot; rail = mark only (left-aligned with icon column, `px-3`). Tone `on-dark` → `/logo/white/`. Link → role home |
| Right | **Pin** control cluster — hidden by default; fades in **140ms** on header hover / focus-within; always visible in peek and `@media (hover: none)` |
| Pin button | See **Pin control** below |
| Settings gear | **Omitted** — account actions live in UserMenu |
| Removed | `SidebarToggle` «, edge handle — **deleted** |

#### Pin control (`SidebarPinButton` + `SidebarPinIcon`)

| Spec | Value |
|------|-------|
| Library | Only `@heroicons/react` installed — **no** push-pin glyph (MapPin = location, unused). Inline `SidebarPinIcon` (Lucide Pin path language, 24×24). |
| Tile | 36×36 (`h-9 w-9`), radius 10; hover-reveal unchanged (header hover/focus-within; always on peek / `@media (hover: none)`) |
| Icon size | **20px** (`size={20}`), stroke **1.75** outline; `shrink-0`, `aria-hidden`, `focusable=false`, `shape-rendering: geometricPrecision` |
| Unpinned | Outline pin, **rotate 45°**, `scale(.92)`, color **white/70%**; tile transparent; hover tile white/12 + icon white |
| Pinned | Filled pin, **rotate 0°**, `scale(1)`, color **`text-secondary`** (yellow CTA); tile **white/10** + inset ring white/10; hover tile white/14 |
| Transition | Crossfade two stacked icons **140ms** + rotate/scale **150ms** (`--sidebar-ease`); reduced-motion: no rotate/scale, fade **80ms** only; press `scale(.96)` |
| Tooltip | Portal; delay **300ms**; right + 8px; radius 10; label 12/16 medium + SearchBar-style **`[`** keycap (20px, radius 6, border + raised surface, 11px semibold); `hoverFineOnly` (no tip on touch); content “Fijar menú” / “Soltar menú” |
| A11y | `aria-pressed`, dynamic `aria-label`, `aria-keyshortcuts="["`; live region unchanged (“Menú fijado” / “Menú sin fijar”) |
| Do not | Location pin icons (`MapPin`); glyphs &lt; 18px; plain “([)” tooltip text; hardcoded hex |

#### Spacing scale & concentric radii

| Token | Value |
|-------|-------|
| `--space-1` … `--space-8` | 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 |
| `--r-panel` | 28px (center + Centro social) |
| `--r-card` | 20px |
| `--r-tile` | 14px (nav items) |
| `--r-ctl` | 12px |

#### Derived surface tokens (light + dark via `color-mix`)

| Token | Role |
|-------|------|
| `--glass-1` / `--glass-2` | 6% / 10% cream-or-fg over transparent — hover / active on dark frame |
| `--glass-light-1` / `--glass-light-2` | Same on light panels |
| `--hairline-dark-surface` / `--hairline-light-surface` | ~10% hairlines |
| `--glow-accent` | secondary @ 55% — indicator glow |
| `--shadow-panel` / `--shadow-float` | Soft ambient panel elevation |
| `--panel-highlight` | 1px inset top highlight on glass panels |

#### SidebarItem

| State | Look |
|-------|------|
| Default | h-44, radius `--r-tile`, gap-12; **no icon tile**; icon 20 stroke 1.75 @ 70%; label 14 medium @ 72% |
| Hover | `--glass-1`; icon/label → 92% (`@media (hover: hover)`) |
| **Active** | `--glass-2` + inset hairline; label 100% semibold cream; icon `--color-secondary`; **shared sliding indicator** (3×20, left of nav, glow `--glow-accent`, 240ms) |
| Pressed | scale .99 (80ms; reduced motion: none) |
| Focus-visible | 2px `secondary` ring |
| Pronto | muted; Badge “Pronto”; Tooltip |
| Badge | secondary (accent) pill h-18, tabular nums, cap **99+**; rail → corner dot |
| Rail | 48×48 centered; Tooltip right |

**SSR:** `.nabbi-sidebar-item__indicator-fallback` on active item until `SidebarNavIndicator` sets `data-indicator-ready`.

#### Movimiento del Sidebar

Tokens: `--sidebar-ease-out`, `--indicator-ease`, `--sidebar-dur-fast|base|slow`.

| Motion | Trigger | Duration | Notes |
|--------|---------|----------|-------|
| Indicator slide | route / resize / mode | 240ms | `translateY(var(--indicator-y))` |
| Item hover/press | pointer | 120ms / 80ms | glass + scale |
| Float enter/exit | peek | 180ms | opacity + translateX(-8px) |

**Rules:** keyframes declared **only** under `[data-sidebar-mode="expanded"]`; collapsed/floating/mobile → `animation: none` + 120ms bg/opacity. Solo `transform`, `opacity` y `clip-path`; `will-change` only while animating; curvas **después** del cuerpo; no animar width/left/height. Stagger: `sessionStorage nabbi:sidebar-stagger` (expanded once); drawer/rail/peek stagger **off**. `prefers-reduced-motion`: 120ms opacity/bg only; no stagger/pop/clip.

#### Groups (`children` on `NavItemConfig`)

| Spec | Value |
|------|-------|
| Row | Same as item + trailing chevron (90° rotate, 160ms) |
| Children | `ml-28` + `pl-12`, guide line 1px white/12; child h-36, label 13.5; active child = soft pill white/12 **without** yellow bar; parent shows yellow **dot** when child active |
| Expand | `grid-template-rows` 0fr→1fr, 180ms; reduced-motion instant |
| Persist | `localStorage` `nabbi:nav-groups:v1:{userId}` (try/catch); auto-open when child active |
| Rail | Groups not expandable; click icon → peek + expand that group |
| Current usage | **PLACE** only: group “Negocio” → Equipo (`/links`), Horario (`/schedule`). PRO Servicios/Ventas/Calendario stay flat Pronto (no real routes). |

#### Sections / scroll / footer

- Section labels: **optional**. 11px uppercase tracking 0.12em white/45% when present; rail → 1px white/10 divider (`my-3`) only for **labeled** sections. Label-less first section (PRINCIPAL): no label, no reserved 28px row. *Las etiquetas de sección son opcionales; no se muestran cuando solo existe una sección.*
- **Separador** cabecera↔nav: 1px `border-top` on `.nabbi-sidebar__nav-divider` (outside the scroll region), token `--sidebar-divider` (= white/10 on the dark frame), horizontal inset **12px** (`margin-inline: 12px`). Then `--sidebar-nav-pt: 20px` padding on `.nabbi-sidebar__nav`. Same in pinned / rail / peek / drawer. Header has **no** bottom border (avoid double lines).
- Nav top gap: `--sidebar-nav-pt: 20px` on `.nabbi-sidebar__nav` (below the divider).
- `sidebarSectionsForRole`: `label?` (sidebar visible) + `breadcrumbLabel` (always; PRINCIPAL → “Principal” for crumbs/titles via `NAV_SECTION_LABELS`).
- Nav scroll: thin 6px scrollbar (thumb white/15 on hover); fade masks 16px; `overscroll-behavior: contain`
- Active item: `aria-current="page"`; scroll into view on mount; match via `nav-config`
- Profile: `SidebarProfileCard` → `ProfileHero` (see ProfileHero anatomy below). Rail = 36px avatar / 44px ring + tooltip; UserMenu icon portal. **Active affordance** when `isAccountPath` → presence dot on avatar.
- **Rule:** Las acciones de cuenta viven en el menú del usuario (bloque inferior del sidebar); **no duplicarlas** en la navegación.
- **Una sola superficie:** el gradiente de marca se pinta **una sola vez** en el FRAME (`--shell-frame-bg` = highlight + vignette + linear). Sidebar, header, nav y user block son **transparentes**. Peek/drawer: mismo token con `background-attachment: fixed` + `background-size: 100vw 100dvh` para alinear píxeles al viewport; border white/10 + `shadow-dropdown` los separan del panel. Fades del scroll = `mask-image` (alpha), nunca overlays de color. Siempre dark-green frame en light **y** dark.

**Do not (frame paint):** segundo gradiente en el contenedor del sidebar; `overflow`/`contain:paint` en cajas pintadas; fades con `from-/to-` de color; highlight/vignette con geometría distinta a la del frame.

#### Persistence (no flash)

- Cookie `nabbi_sidebar=pinned|unpinned`; `path=/`; `Max-Age=1y`; `SameSite=Lax`
- Legacy mapped once: `expanded`→pinned, `collapsed`→unpinned; old `localStorage nabbi-sidebar-collapsed-{userId}` → cookie then delete
- Server `(app)/layout.tsx` → `parseSidebarCookieValue` → `initialSidebarPinned`
- Default unset: **pinned** xl+, **unpinned** lg–xl

#### Mobile / tablet (&lt; lg) — burger drawer

| Piece | Spec |
|-------|------|
| Header | 56px + safe-area top; **left** burger 44 (`aria-label` Abrir/Cerrar menú, `aria-expanded`, `aria-controls=nabbi-sidebar-drawer`); logo; **right** search icon + bell only (**no** avatar) |
| Icon morph | Bars ↔ X, 180ms when drawer open |
| Drawer | `min(86vw, 320px)`; frame gradient; same items/groups/user; close X 44; no pin; LocationPill; `role=dialog` `aria-modal` label “Menú” |
| Gestures | Backdrop / Esc / route close; swipe-left ≥60px close; edge swipe-right from left **16px** open; body scroll lock + cleanup; focus trap; restore focus to burger |
| Bottom nav | **`SHOW_MOBILE_BOTTOM_NAV = false`** — not rendered; no reserved bottom padding. Component kept behind flag |

#### A11y

- `<nav aria-label="Navegación principal">`; group `aria-expanded` / `aria-controls`; pin `aria-pressed`; peek is **not** a dialog (no trap) but Esc-dismissible; yellow rings on dark; polite live region for pin; touch targets ≥44 in drawer

#### Do not (sidebar)

- « collapse toggles, always-visible collapse controls, or edge handles
- Second user entry on mobile header
- Change `--sidebar-w` / panel layout on peek
- Hardcoded hex in `web/components/shell`; emojis; native `<select>`
- Mount desktop Sidebar and drawer at once

### Logo / BrandLockup

Canonical: `web/components/brand/BrandLockup.tsx` · assets `/public/logo/{default,white,black,negative}/{icon,text}.png` (**alpha-cropped**; `logo.png` is a vertical stack — not used in the header lockup).

| Spec | Value |
|------|-------|
| Rule | **Lockup en una sola pieza:** bases mark **32** / word **20** × **`--brand-scale: 0.85`** → visible **27px / 17px**; gap **`--brand-gap: 5px`** (tight, 4–6); sin caja ni slot de ancho fijo |
| API | `variant: "full" \| "mark"`, `size: "sm" \| "md" \| "lg"`, `tone: "on-dark" \| "on-light"`, `href` |
| Layout | `inline-flex` + `align-items: center` + gap var; never `justify-between` / fixed mark slot / stretch |
| Tone | `on-dark` → `white/`; `on-light` → `default/` |
| A11y | `role="img"` aria-label “nabbi”; link “nabbi, ir al inicio”; focus ring `secondary` |
| Rail | `variant="mark"`: word `max-width:0` + opacity 0 + gap 0 (260ms); mark **left-aligned** same inset as nav icon column |
| Do not | Marca en slot de ancho fijo separado del nombre; tile/bg/radius; filters; hardcoded hex |

`NabbiLogo` remains a thin back-compat wrapper (auth / legal / 404). Prefer `BrandLockup` for new chrome.

### Avatar (header / sidebar)

`fallbackTone="cta"` → yellow + dark initials. Focus ring on the same `rounded-full` trigger. Never square outline.

### Responsive

| Width | Behavior |
|-------|----------|
| ≥ 1280 | Pinned default (unless cookie); search with kbd |
| 1024–1279 | Unpinned rail default; hover peeks; `[` pins |
| &lt; 1024 | No frame; burger + drawer; no bottom nav |
| ≤ 390 | Hit ≥ 44px; no horizontal overflow |

Prefer **`100dvh`**, never `100vh`. Portals for menus so panel overflow never clips.

### Do not

- Per-page sidebars / sticky headers / competing max-width wrappers
- Avatar in the Topbar when a sidebar is present; avatar in mobile header when drawer owns user entry
- Duplicate titles (Topbar h1 + page PageHeader) — page owns the h1; Topbar fallback h1 only as documented exception
- Negative-offset badges; ad-hoc icon buttons outside `TopbarButton`
- Hardcoded hex / `rgb()` in `web/components/shell`
- Labels in muted green; icon-only items without tooltip / `aria-label`
- Edge-to-edge underlines; seam lines under a flat header
- Leave unused localStorage sidebar keys after migration
- Emojis in chrome
- `SidebarToggle` / edge handle / always-visible « controls

---

## 6c. Navegación

Config: `nav-config.ts` — `{ key, label, href, icon, roles, badgeKey?, match, comingSoon?, section, mobile?, mobilePrimary?, children? }`.
Helpers: `isNavGroup`, `flattenNavItems`, `navLeavesForRole`.

### Roles (sidebar)

| Role | PRINCIPAL | NEGOCIO |
|------|-----------|---------|
| **CLIENT** | Explorar, Feed, Reservas, Favoritos | — |
| **PROFESSIONAL** | Explorar, Feed, Calendario *(Pronto)*, Reservas, Favoritos | Servicios *(Pronto)*, Ventas *(Pronto)* — flat |
| **PLACE** | same as PRO | Group **Negocio** → Equipo (`/links`), Horario (`/schedule`); + Servicios/Ventas *(Pronto)* flat; PRINCIPAL includes Favoritos after Reservas |

**Favoritos** — `key: favoritos`, href `/favorites`, Heart outline/solid, roles CLIENT|PRO|PLACE (API `IsAuthenticated`, no role gate), `match: prefix`, no badge. Breadcrumb / `usePageHeader`: **Principal › Favoritos**. Title “Favoritos \| nabbi”.

**No CUENTA section in the sidebar.** Account routes (`/me`, `/notification-preferences`, `/help`, `/profile`) live in `ACCOUNT_ROUTES` (`nav-config.ts`) for breadcrumbs / titles / `isAccountPath`, and are reached from the UserMenu.

Avisos = header bell only. Missing routes = `comingSoon` + Pronto.

Mobile: burger drawer (bottom nav off by default). `mobilePrimary` still used if `SHOW_MOBILE_BOTTOM_NAV` is flipped on. Breadcrumbs / `usePageHeader` defaults: nav item first, else `getAccountRouteByHref` → section crumb **Cuenta** (non-interactive) + page label (e.g. Cuenta › Mi cuenta).

### NavItem (CLIENT frame bar only)

Soft pills when `CLIENT_USES_SIDEBAR=false`. Sidebar items use `SidebarItem` / `SidebarGroup` in §6b.

**Never** muted green for labels; never edge-to-edge underlines.

---

## 6d. Componentes base

Web: `web/components/ui/`. Prefer these before one-offs.

### Card

- Surface `bg-card`, 1px `border-card-border`, radius **16** (`rounded-2xl`), padding 14–20
- Optional `hover` lift; `interactive` + focus ring; polymorphic `as`
- **Do not:** card-soup (wrapping every paragraph); heavy multi-shadow

### Badge

- Tones: `neutral` | `brand` | `success` | `warning` | `error` | `info`
- Sizes `sm` / `md`; optional dot or leading icon
- **Do not:** emoji badges; hardcoded hex

### StatusBadge

Canonical: `web/components/reservations/StatusBadge.tsx` + `statusConfig.ts`.

**Rule:** los estados de reserva se renderizan **siempre** con `StatusBadge`; los colores **nunca** se definen en la página.

| Status (backend) | Label | Tone | Mark |
|------------------|-------|------|------|
| `PENDING` | Pendiente | warning | pulsing 6px dot (2s; reduced-motion: static) |
| `CONFIRMED` | Confirmada | success | static dot |
| `COMPLETED` | Completada | brand | check-circle 14 |
| `CANCELLED` | Cancelada | danger | x-circle 14 |
| `REJECTED` | Rechazada | danger | x-circle 14 |
| unknown | humanized raw | neutral | static dot |

Sizes: `md` h-28 / `sm` h-24; soft tone fill + 1px tone border; text = tone strong (≥4.5:1). Props: `status`, `size?` only.

### Fila de reserva (`ReservationRow`)

Canonical: `web/components/reservations/ReservationRow.tsx` · CSS in `globals.css` (`.nabbi-rr`).

**Container breakpoints (once):** `nabbi-row` — **row-compact** &lt;400 · **row-stack** 400–639 · **row-wide** ≥640. Layout via CSS grid areas; same DOM order (tile → title/meta → status → price → chevron).

| Breakpoint | Layout |
|------------|--------|
| row-wide (≥640) | Single row: tile 56 · content · footer (price / StatusBadge / chevron) |
| row-stack (400–639) | Tile 48 + content; footer under content (badge left, price + chevron right); time inline |
| row-compact (&lt;400) | Same stack; time on its own line; place omitted; title line-clamp 2 |

| Piece | Spec |
|-------|------|
| Touch | Min height **72**; padding 14/16; whole row tappable; `:active` tint 80ms in / 200ms out; hover only under `@media (hover: hover)`; chevron always visible on `(hover: none)` / `(pointer: coarse)`; `-webkit-tap-highlight-color: transparent` |
| Date tile | Upcoming brand tint / past muted; Hoy + accent dot; day 18 / month 10 on mobile |
| Avatar | Circle 20px mobile / 24 desktop; brand-token initials only |
| StatusBadge | `size="sm"` (24) mobile; nowrap; never overlaps chevron |
| Link | `/reservation/{id}`; aria-label `{servicio}, {proveedor}, {fecha} {hora}, estado {estado}` |
| Dividers | Inset from content column; panel list flush (padding 0); rows own 16px |
| Motion | 4px fade/translate, 30ms stagger (max **6**); filter cross-fade 120ms; reduced-motion off |
| Tabs/chips | Horizontal snap scroll + edge fades; tab h-48; chips h-36 touch; active tab `scrollIntoView`; chips **not** sticky (panel does not independently scroll) |

**Checklist mobile:** 320 no overflow · 360/390 two-line card · tabs/chips scroll with fades · pressed tint · ≥640 desktop single-row · landscape uses container width · light/dark · reduced motion.

### Avatar

- Image or initials fallback with deterministic **brand** token color (`fallbackTone="auto"`) — circle always visible
- Header/shell: `fallbackTone="cta"` → yellow CTA bg + dark initials (readable on frame)
- Sizes `xs`–`xl`; `ringClassName` overrides default `ring-card`; focus ring must share `rounded-full` with the trigger
- **Do not:** dark initials on dark surfaces; square outline/ring; undefined token classes that leave bare initials

### PageHeader

Canonical: `web/components/ui/PageHeader.tsx` · visibility `usePageTitleVisibility` via `PageHeaderProvider` · condensed title in `PanelTopbar`.

`variant`: **`"legacy"` (default)** | **`"compact"`** | **`"banner"`**.

#### compact — adoptado en Mi cuenta; migración de otras páginas pendiente

Sin eyebrow: la navegación ya indica la sección. Descripción opcional, una sola línea, solo si aporta contexto (oculta &lt;640px).

```
[ title  meta? ] .................... [ actions? ]
  description? (sm+)
```

| Prop | Spec |
|------|------|
| `title` | **h1** — 30px (≥640) / 28px (&lt;640), semibold, lh 1.15, tracking −0.02em, `text-foreground` |
| `description?` | 14px muted, max 60ch, truncate ≥640; hidden &lt;640; mt 4px |
| `meta?` | Inline data badge; `aria-live="polite"` |
| `actions?` | Right-aligned; stacks full-width on mobile |
| `divider?` | Hairline under header; **default false** |
| Spacing | Top pad 28 / 20 mobile; 20px below; ~44px title-only / ~64px with description. Cancel shell `py-6`/`py-8` with negative margin so padding is not doubled. |

**Condensed topbar title** (compact only): when header leaves `.nabbi-shell-panel__scroll` (IO, `rootMargin` −72px), Topbar left shows context title — 15px semibold, truncated, opacity + `translateY(4px)`→0 180ms ease-out (opacity-only if reduced-motion); hide if title slot &lt;160px; `aria-hidden`; single h1 remains PageHeader.

#### legacy (en transición)

Tall stack (~100px): optional `label` (11px uppercase eyebrow) + h1 (24–28 extrabold) + `subtitle` + `meta` / `actions`, `py-6`. Still the default for Explorar, Favoritos, Mis reservas until migrated.

#### banner

Feed dark gradient card (`variant="banner"`). Keep Feed on this path; do not invent other heroes.

**Do not:** invent a new hero band per screen — use PageHeader.

### Página Mi cuenta (`/me`) — role-aware

Canonical: `web/features/account/` (`AccountPage` + `accountViews` + `accountVariants`) · route `web/app/(app)/me/page.tsx`. Shared rows: `web/components/account/`. Roles: `roleLabelEs()` — **never** raw enum. **Una sola fuente de verdad** para favoritos (`useFavorites`) y reservas (`useAccountReservations`).

#### Architecture

| Piece | Spec |
|-------|------|
| Entry | `AccountPage` → `accountViews[role]`. Suspense + `AccountSkeleton`. |
| Config | `lib/accountVariants.ts` — `summaryFields`, `kpis`, `tabs`, `dashboard` flag per role. **No role branching inside shared summary/KPI/tab JSX.** |
| Chrome | `PageHeader variant="compact" title="Mi cuenta"` — no description, no eyebrow, no header actions. Title “Mi cuenta \| nabbi”. Condensed topbar title on scroll. |
| Layout | Stack: **AccountSummary** → Actividad toolbar → **KpiCard**×4 → **TabbedCard**. CQ `@container/account`. Rhythm: **24** header→summary→toolbar; **12** toolbar→KPIs; **24** KPIs→tabs (`--page-gap` / `--page-gap-tight`). |
| Elevation | Summary + tabs panel radius **20**, KPI **16**; shadows `card` / `card-hover`; hairline `border-card-border`. |

#### AccountSummary

| Piece | Spec |
|-------|------|
| Zones | **Top:** avatar 88 + ring-4 card + 1px hairline outline; name **26** semibold tight; email 14 secondary; badges h-24; actions side-by-side h-40 (primary yellow “Editar perfil” + ghost “Reservar un servicio”). **Bottom:** details strip behind hairline, tinted surface, `auto-fit minmax(180px,1fr)` (≥900) / 2-col (≥480) / 1-col; cells separated by 1px via gap-px grid — **never orphan wrap**. |
| Decorative | Soft brand-green radial tint (≤8% opacity) behind avatar, clipped by card `overflow:hidden`. **Sin franjas recortadas** — no hard top accent strip. |
| Edit | `EditProfileSheet` unchanged. Omit empty fields (teléfono, alertas, …). |

#### KpiCard (`variant="premium"`, default)

| Piece | Spec |
|-------|------|
| Numerals | **Always** `text-foreground` 32 semibold tabular — tone never on the number. |
| Icon | Tile 36 radius 12 top-left; tone tint + strong icon. Label 13 secondary beside icon. |
| Context | 12 muted — **solo datos reales** (share `%` when total&gt;0; “Historial completo”; “Guardados”; “Aún no hay registros” when 0/0). |
| Link hover | −2px / border tint / `shadow-card-hover` 180ms; arrow-up-right on hover; focus ring brand. |
| Period | Compact CustomDropdown 36px ghost + calendar icon (`.nabbi-period-compact`); label “Actividad” 15 semibold. |

#### Tabs (`TabbedCard` — Mi cuenta only; shared `ui/Tabs` unused)

| Piece | Spec |
|-------|------|
| Indicator | **One** sliding 2px brand-green bar (measured width/left, 240ms); no per-tab `border-b`, no overflow scrollbar ghost. |
| Labels | 14 semibold; inactive secondary + hover soft pill; counts on Reservas/Favoritos (real). |
| Header | h-56, px-24 desktop; chips right ≥900, wrap/scroll below on narrow. |
| Rows | Shared `ReservationRow` + `StatusBadge` (see § StatusBadge / Fila de reserva). |

#### PROFESSIONAL / PLACE (stubs)

EmptyState from variant placeholder copy + Preferencias tab (`AccountSettingsPanel`). No KPI row.

**Do not:** invent deltas; clipped accent strips; toned KPI numerals; stray tab tracks; hardcoded hex; role checks inside shared cards.

### Página Favoritos (`/favorites`)

Canonical: `web/features/favorites/` (`FavoritesPage`, `FavoriteCard`, `useFavorites`) · route `web/app/(app)/favorites/page.tsx`.

| Piece | Spec |
|-------|------|
| Chrome | PageHeader **legacy**: label **Principal**, h1 **Favoritos**, subtitle “Profesionales y lugares que guardaste.”, meta Badge `aria-live` “N guardados”. Title “Favoritos \| nabbi”. |
| Toolbar | Segmented Todos \| Profesionales \| Lugares (`?type=`); CustomDropdown Ordenar: Recientes \| Mejor valorados (`?sort=`). Category + “Más cercanos” **omitted** (API has no categories/distance on favorites). |
| Grid | `@container/favorites`: 1 / 2@640 / 3@1100 / 4@1500 cols; gap 16–20; equal-height cards. |
| Card | Reuses Explorar `ResultCard` + heart toggle 40px top-right (filled error-tint when saved, outline when not; `aria-pressed`). Whole card → `/profile/{public_profile_id}`. |
| Toggle | Optimistic remove → Toast “Quitado de favoritos” + **Deshacer** (5s); rollback on error. Live region announce. |
| States | Skeleton×8; empty (heart tile + CTA Explorar); filtered-empty + Limpiar; error + Reintentar. Infinite scroll sentinel + “Ver más”. |
| Hook | **One** `useFavorites` (list, toggle, optimistic remove/restore, BroadcastChannel/`storage` sync) — page, Mi cuenta preview, profile heart. |

**Do not:** duplicate full grid on Mi cuenta; invent distance/category filters without API fields; hardcoded hex; emoji.

### EmptyState

- Icon in soft tile (`foreground-secondary` at reduced opacity), title, description, primary/secondary actions
- Sizes `sm` / `md` / `lg`; vertical-centering friendly
- Spanish copy defaults (“Algo salió mal”, etc.)

### Skeleton

- `Skeleton`, `SkeletonCard`, `SkeletonList`
- Pulse shimmer; `motion-reduce:animate-none`

### Toast

- `ToastProvider` + `useToast` (`success` / `error` / `info`)
- Auto-dismiss **4s**, pause on hover, `aria-live="polite"`
- Stack: bottom-right desktop / top under header on mobile
- Mount provider in AppShell

### Dialog / Modal

- Portal, focus trap, Esc, backdrop; sizes `sm` / `md` / `lg`
- Mobile: bottom-sheet presentation (aligned with `CustomDropdown` sheet)
- Slots: header / body / footer

### Tabs

- Underline style: active yellow label + 2px underline; inactive secondary
- Roving tabindex (arrows); `tablist` / `tab` / `tabpanel`

### Tooltip

- Hover/focus, **500ms** delay, portal, card surface token
- Use for sidebar rail labels

### FilterChip / ChipGroup / ChipRow

**Rule:** Los filtros usan FilterChip dentro de ChipRow (o ChipGroup); los multi-valor largos usan CustomMultiSelect.

| Part | Spec |
|------|------|
| FilterChip | Pill; height **32** fine / **36** coarse; min-width 44; padding 0 14; selected = soft brand-tint + check 16 in a **reserved icon slot** (no layout shift); `variant="accent"` = yellow CTA; unselected = transparent + hairline border; hover only under `@media (hover: hover)`; `:active` tint 80ms; optional icon / count (`tabular-nums`); `selectionRole="toggle"` → `aria-pressed` / `"radio"` → `aria-checked` |
| ChipGroup | Single or multiple; wraps chips in **ChipRow**; optional “Todas” / none chip; optional leading/trailing |
| ChipRow (scroll horizontal) | Shared scroller for every filter chip row. **Container switch:** `< 640` inline-size → single line, `overflow-x: auto`, nowrap; `≥ 640` → wrap (or single line if it fits). **No viewport media queries** for layout (`container-type: inline-size`). |
| Edge bleed | `--chip-row-pad` (default 16px): negative `margin-inline` + matching `padding-inline` so first/last chips align with content and scroll under panel edges |
| Snap / feel | `scroll-snap-type: x proximity`; snap-align start; `scroll-padding-inline` = pad; `overscroll-behavior-x: contain`; touch pan; scrollbar hidden; vertical wheel → horizontal when narrow + overflow (passive: false, cleaned up) |
| Edge masks | 24px gradient from `--chip-row-surface` (card/background token); shown only when overflow in that direction (`data-can-scroll-start/end` via rAF + ResizeObserver); 140ms opacity (0ms if reduced motion) |
| Selected | Center selected chip in the row via `scrollTo` on the scroller (never page `scrollIntoView`); mount = auto, later = smooth unless reduced motion |
| Arrows | Fine pointer + overflow + narrow: 28px circular chevrons on hover/focus-within; scroll 60% width; `aria-hidden` (keyboard uses arrows). Hidden on touch |
| A11y | Single: `role="radiogroup"` + chips `role="radio"` / `aria-checked`. Multi: `role="group"` + `aria-pressed`. Roving tabindex; ArrowLeft/Right/Home/End; focus ring not clipped (`padding-block: 2px`) |
| Pages | Mi cuenta Reservas · Explorar (ubicación+tipo, categorías, activos) · Feed Categorías · Favoritos tipo · ChipGroup consumers |

**Do not:** native `<select>` for filters; ad-hoc chip CSS per page; emoji chips; hide overflow without masks.

### Feedback routes

Authenticated group (`web/app/(app)/`): `error.tsx`, `loading.tsx`, `not-found.tsx` using EmptyState / Skeleton.

---

## 6e. Header chrome (authenticated)

### Breadcrumbs / BreadcrumbBar

**Estado: implementado** como `BreadcrumbBar` (= `PanelTopbar`) en el panel: trail `Sección › Página` desde `usePageHeader` / route labels; derecha Search → LocationPill → Bell. Acciones de página en `PageHeaderRow`. Ver **6b**.

Shared control style: `TopbarButton` (44px, `rounded-full`).

**Mobile (&lt; lg):** menu · título de página · search icon · bell. Location en drawer.

### Barra de búsqueda

Canonical: `web/components/shell/SearchBar/` (`SearchBar`, `SearchChromeProvider`, `useAppSearchQuery`). **One search for the whole app** — a real `<input type="search">` in the Topbar. No command palette, modal, overlay, or suggestion panel.

#### Anatomy

| Part | Spec |
|------|------|
| Leading icon | Magnifying glass 18px; brand-green when active |
| Input | `type="search"`, `name="q"`, `enterKeyHint="search"`, `autoComplete="off"`, `spellCheck={false}`, `inputMode="search"`; font 14px / 500 (16px mobile); placeholder 400 **tertiary** |
| Clear | X when value non-empty; 44px hit; native webkit cancel hidden |
| Submit arrow | Focused + non-empty + route ≠ Explorar |
| Keycap | `Ctrl K` / `⌘ K` when not focused and empty; **hidden while focused** (placeholder stays) |

Accessible name: `aria-label="Buscar profesionales o lugares"`; form `role="search"`.

#### Layout model (desktop `lg+`): grow LEFTWARDS, never push siblings

1. Topbar = `position: relative; container-type: inline-size; container-name: topbar; overflow: visible`.
2. Right cluster = `shrink-0` fixed items: **[SearchSlot][LocationPill][Bell]**. Pill and bell **never** change size for search (no `data-search-active` compaction).
3. **SearchSlot** reserves the **rest** footprint (`width: var(--search-w-rest)`, h 44). The bar is `position: absolute; right: 0; top: 0; width: var(--search-w)` and expands **to the left** over the title/breadcrumb zone.
4. `--cluster-rest-w` = measured width of [pill+bell+gaps] via ResizeObserver on `.nabbi-topbar-cluster__rest`.
5. While search is active, title/nav fades (`opacity: 0`, `pointer-events: none`, 150ms) but **keeps layout space**.
6. Transition: width 220ms `cubic-bezier(.2,.8,.2,1)` + border/shadow 180ms; reduced-motion: no width animation.

#### Dimensions

| Breakpoint | Rest (`--search-w-rest`) | Active (`--search-w-active`) |
|------------|--------------------------|------------------------------|
| `xl+` (≥1280) | **280px** | `max(440px, min(720px, 100cqw − 2·topbar-px − cluster-rest − 24px))` — always **> rest** |
| `lg` (1024–1279) | **240px** | `max(360px, min(520px, same calc))` — always **> rest** |
| `< lg` | Icon 44px | Full-width mobile morph (not absolute) |

Active visuals: raised surface, brand border + 3px outer ring ~20% alpha (box-shadow), soft shadow; placeholder **always visible when empty** (“Buscar profesionales o lugares” while active; rest may show “Buscar” if slot narrow).

Filled but blurred → **rest** width (truncated value + clear). Esc empty → blur + contract. Blur debounce 120ms; keep expanded while pointer is down on bar controls.

#### Mobile morph (`variant="mobile"`, `< lg`)

Icon → full-width header row: `[back 44][input flex-1 min-w-0][clear/submit]`, h **48**, font **16px** (no iOS zoom), placeholder “Buscar profesionales o lugares”, autofocus, `enterKeyHint="search"`, safe-area insets. **Never** an intermediate/shrunken width (320–1023, including landscape). Crossfade 150ms (reduced-motion: instant). No overlay/backdrop. Esc/back restores focus to the icon.

#### Do not

- Shrink on focus; compact LocationPill/Bell for search; hide placeholder when empty; fixed widths on mobile; `overflow: hidden` on Topbar/cluster/SearchSlot (breadcrumb/title text may truncate alone).

#### URL contract (`q`)

Shared hook: `useAppSearchQuery`.

| Rule | Detail |
|------|--------|
| Param | `q` (same as Explorar) |
| Normalize | Trim + collapse whitespace |
| On `/explore` | Live filter; debounce **300ms**; `router.replace(..., {scroll:false})` while typing; min length **2** for live write (1 char = local only + `aria-describedby` “Escribe al menos 2 caracteres”); empty clears param |
| Elsewhere | Typing edits input only; Enter / submit arrow → `router.push(/explore?q=…)` |
| Sync | Input mirrors URL `q` when not focused or when URL differs from last value this bar wrote |
| Chip | Explorar active-filters: `Búsqueda: «…»` removable; clearing chip or “Limpiar filtros” clears Topbar via URL |

Explorar has **no** page-level search input — Topbar is the only free-text search.

#### Keyboard

Exactly **one** global handler (`SearchChromeProvider`): Ctrl/Cmd+K and `/` focus the bar (select contents) unless typing in another field. Enter submits (IME-safe: ignore while `isComposing`). Esc: clear if text (and clear `q` on Explorar); else blur (and collapse mobile).

#### Tokens

Surface/border/radius = TopbarButton; focus = primary ring; text = foreground / foreground-secondary; submit = secondary CTA; shadow = dropdown token. Transitions 180ms.

#### Do not

- Command palette / modal / overlay / suggestion panel for search
- Second free-text search input on any page (including Explorar filter card)
- Emojis; hardcoded hex; duplicate Cmd+K listeners; leftover recents localStorage keys (one-time cleanup on shell mount)

### Ubicación

Canonical: `useLocationFilter` + `web/components/shell/Location/` (`LocationPill`, `LocationPopover`, `LocationRow`).

**Single source of truth:** Topbar pill, drawer `LocationRow`, and Explorar “Cerca de mí” chip all read/write the same store (`enabled` / alias `nearby`, `coords`, `radiusKm`, `label`/`city`). Exactly **one** location control in the Topbar — never a second pin. Search expansion grows leftwards over free space; the pill does **not** compact for search.

#### Pill (`LocationPill`) — TopbarButton 44px

| State | Look |
|-------|------|
| none / prompt | Pin + “Ubicación” + yellow CTA dot; tooltip “Activa tu ubicación…” |
| locating | Spinner + “Ubicando…” |
| ready + enabled | Brand-green pin + short place + radius chip (`5 km`, brand-tint) + green success dot |
| ready + disabled | Outline pin + place + muted radius chip |
| denied | Pin-off + “Ubicación bloqueada” + warning dot |
| error | Alert + “Reintentar” |
| unsupported | Manual-only (no GPS CTA in popover) |

Breakpoints: `xl+` icon+label+chip; `lg` icon (+ chip/short); `<lg` not in mobile header — use `LocationRow` in drawer. Truncate `max-w-[160px]` + Tooltip. First-visit only: yellow dot pulses ×2 if permission prompt (reduced-motion: none). Neutral skeleton width until hydrated (SSR-safe).

#### Popover / sheet (`LocationPopover` via `HeaderPopover`)

Canonical anatomy — **standard Popover form patterns** for shell chrome.

| Part | Spec |
|------|------|
| Desktop shell | Width `min(400px, calc(100vw − 24px))`; radius **24**; panel-raised + 1px border + layered shadow; `overflow: hidden` on outer (radius clip); `overflow-x: hidden` everywhere inside; all flex children `min-w-0`; max-h `min(640px, calc(100dvh − 96px))` |
| Placement | `bottom-end` aligned to the **right edge of `.nabbi-topbar-cluster`** (not the pill alone); offset **12px** below; collision padding **12px**; transform-origin at pill; enter 160ms (scale .98 + fade + translateY(−4px)); reduced-motion: fade only; **no caret** |
| Pill open | Brand-tint surface + brand border (`TOPBAR_BTN_ACTIVE`) |
| Structure | **Header** (brand band, fixed) · **Body** (scroll vertical only) · **Footer** (sticky). `HeaderPopover bodyScroll={false}` |
| Padding | All content blocks: **`px-5` (20px)** via a single `Section` wrapper. Vertical: `space-y-5` (20px) between sections; **8px** label→control and control→helper. Full-width dividers sit outside padded blocks (no negative margins) |
| Overflow | Body: vertical scroll only; when content fits → **no** scrollbar. Never horizontal scroll. Do **not** apply raw `.scroll-premium` here (its `-mx-2` cancels padding and causes a bottom scrollbar) — use `.nabbi-location-popover__body` |
| Mobile sheet | `<768px` / coarse: 100% width, radius 24 top, max-h **92dvh**, drag handle **on the brand band** (white/40%), sticky footer + safe-area, body scroll lock, swipe-down close; city list = nested sheet (CustomDropdown) |

##### Brand band (header)

Height **88px**, `px-5 py-4`, `--shell-frame-gradient` (diagonal; optional faint pin/ring radial at 6–8% alpha). Left: 40px rounded-12 icon tile (white/12 + white/15 border) + title **Ubicación** 18/24 semibold white + subtitle 13/18 white/72%. Right: 36px close (white/80, hover white/12, focus ring **yellow** on dark band).

##### Body sections (order)

1. **Current / empty card** — subtle surface, 1px border, radius 16, pad 14/16. With location: brand-tint pin tile, 15 semibold truncate label, 12 secondary (“Detectada… · hace 5 min” / “Elegida por ti”), 36px Actualizar (Tooltip + spinner), stale → Badge. Empty: dashed border, pin tile, 14 medium + 12 secondary prompt.
2. **Primary action** — **one yellow CTA visible at a time** (see state table).
3. **Divider** — “o elige tu ciudad” 12 medium secondary, 1px border lines.
4. **City** — label 13 medium **primary** (not muted/green); field = Topbar/form control: h 48, radius 14, raised surface, 1px border, hover brand-tint, focus brand ring; leading pin 18 secondary; placeholder 14 **tertiary** (neutral); CustomDropdown portal, width=trigger, max-h 280.
5. **Radius** — row: “Radio de búsqueda” 13 medium · value “N km” 13 semibold brand-green tabular. Track: subtle surface, radius 14, pad 4, 1px border; **`grid grid-cols-6 w-full`**; segments min-h 40 (44 touch); selected = raised surface + soft shadow + brand-tint border + brand-green text (**not yellow**); 180ms; radiogroup + arrows. Helper 12 secondary, mt 8.
6. **Nearby switch card** — subtle surface, radius 16, pad 14/16; title 14 semibold + helper 12; Switch 44×26 / thumb 22; OFF = border-strong, ON = **brand-green** (not yellow); disabled 50% + not-allowed when no location.
7. **Privacy** — 12/18 secondary + 14 lock icon; no card; mt 4.

##### Footer

Top border, panel-raised, pad 16/20, safe-area bottom on mobile. Left: **“Quitar ubicación”** (error, trash) **only when a location exists**; after clear → Toast “Ubicación eliminada” + **Deshacer** 5s (snapshot). Right: yellow **Listo** when location set; else outlined **Cerrar**. Never show a disabled red link.

##### One yellow primary (state table)

| State | Yellow CTA | Other primary actions |
|-------|------------|------------------------|
| No location | “Usar mi ubicación actual” (body) | Footer = outlined Cerrar; no Quitar |
| Locating | Same button → spinner “Ubicando…” | — |
| Location set | Footer **Listo** only | Body GPS = outlined “Actualizar con mi ubicación”; Quitar visible |
| Denied | none | Warning panel + outlined Reintentar; footer Cerrar |

##### Typography (UI font; 400/500/600; tabular-nums on numbers)

Title 18/24 600 · Card title 15/20 600 · Body/controls 14/20 500 · Labels 13/18 500 · Helper 12/16 400 · Value emphasis 13/18 600. **No text under 12px.** Placeholders = tertiary. Section labels not uppercase.

##### Dark mode

Band = dark frame gradient. Body = neutral raised; fields raised-2; selected segment = raised + brand-tint border; switch ON = brand-green. AA text; no green fills in the body.

##### Apply model

Radius, city, GPS, and enabled write the store **immediately**; footer Listo/Cerrar only closes.

#### Persistence & privacy

- Key: `nabbi:location:v2:{userId}` (migrate legacy `nabbi-location-filter` once).
- Coords rounded to **3 decimals** (~110 m); no accuracy stored; GPS TTL **24h** (stale label kept, silent refresh when granted).
- try/catch storage; `storage` event cross-tab; clear on logout.
- Never prompt geolocation on page load — only on user action.
- Privacy copy: “Solo usamos tu ubicación para mostrarte servicios cercanos. No se comparte con otros usuarios.” (coords live in User/profile for providers; client filter is local.)

#### Permissions

`navigator.permissions.query({name:"geolocation"})` when available; subscribe to `change`. `getCurrentPosition({ enableHighAccuracy:false, timeout:10000, maximumAge:300000 })`. Errors: DENIED → blocked panel; UNAVAILABLE/TIMEOUT → retry. Reverse geocode via existing `googleMapsApi.reverseGeocode` (cache by rounded coords; fallback “Cerca de ti”).

#### Do not

- Flush-to-edge controls; negative margins for layout; yellow for selected radius segments or switch ON; green placeholders; always-visible destructive “Quitar ubicación”; raw `.scroll-premium` inside this popover (use `.nabbi-location-popover__body`); prompt on load; second Topbar pin; precise coords in URLs/storage; emojis; hardcoded hex; duplicate stores/listeners.

### Notificaciones (Avisos)

Canonical: `web/features/notifications/` (`NotificationsProvider`, `useNotifications`, mapper, href resolver) + `web/components/shell/Notifications/` (`NotificationsBell`, `NotificationsPopover`, `NotificationItem`) + shared `CountBadge`.

**Product term:** “Avisos”. Full page: `/notifications`. Preferences: `/notification-preferences`.

#### Data model & freshness

Normalized `AppNotification`: `id`, `type` (`reservation` | `review` | `system` | `message` | `social` | `payment`), optional `subType`, `title`, `body`, `createdAt`, `read`/`readAt`, resolved `href`, optional `actor`, `meta`.

| Rule | Spec |
|------|------|
| Source of truth | One `NotificationsProvider` in AppShell; bell, sidebar badge, and document title all read `unreadCount` |
| Count | `GET …/notifications/stats/` → `unread_count` |
| List | `GET …/notifications/?page=&page_size=20` (+ optional `status=unread`); map snake_case in one mapper |
| Mutations | `mark_read` / `mark_unread` / `mark_all_read` / `DELETE` — optimistic + Toast rollback |
| Poll | Unread every **60s ±10% jitter** while tab visible; pause on `visibilitychange` hidden; refetch on visible + `online`; exponential backoff on errors (max 5 min); AbortController + in-flight dedupe |
| Realtime | No websocket/SSE in backend — polling only |
| Popover open | Refetch list if `lastSyncedAt` > 30s |
| Cross-tab | `BroadcastChannel("nabbi-notifications")` + `storage` fallback |
| Title | Prefix `(n) ` / `(99+) ` when unread > 0; compose with route titles; restore on clear/logout |
| Logout | Clear store |

#### Bell + badge

| Spec | Value |
|------|-------|
| Button | TopbarButton 44px; `BellIcon` 20px stroke ~1.85 in `text-primary`; open = brand-tint; hover/focus AA |
| a11y | `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`; label `Avisos` / `Avisos, {n} sin leer` (count lives on the button, not the badge) |
| Structure | `.nabbi-badge-anchor` wraps **button + badge as siblings**. Badge is **not** inside the button (avoids radius/overflow clipping). |
| Geometry | Box 44, icon 20 centered → icon `(12,12)–(32,32)`. Formula: `offset = badgeSize − iconTop − 1px`. Pill 18 → **top/right −7px** (bottom edge y=11, single-digit left x=33). Dot 10 → **−3/−3**. Two-digit / `99+` pills keep the same top-right anchor and grow leftward above y=12. CSS vars: `--badge-offset-x/y`, `--badge-box`, `--badge-icon`, `--badge-pill-size`, `--badge-dot-size`. |
| Look | h/min-w 18, px-1.5, radius 999, 11 bold tabular; error fill + on-error text; `ring-2` / box-shadow surface token (`ring-card` on panel) |
| Caps | hide @0; 1–99 number; ≥100 → `99+` |
| Dot | 10px + same ring when `compact={true}` (rail / tight nav only — **not** tied to search); rail/bottom use `.nabbi-badge-anchor--nav-tile` (pill 16 / dot 8, offsets 4/2) |
| Motion | count↑ → badge pop 220ms (`.nabbi-count-badge--pop`); bell ring rotates **only** the icon; reduced-motion: none |
| Clearance | Anchor `margin-inline-end: 4px` (`.nabbi-badge-anchor`) so overhang clears the next control |
| Clipping | Topbar cluster / ancestors must be `overflow: visible`; only the title `truncate` element may clip text |
| Do not | El badge nunca se superpone al icono ni vive dentro del botón con overflow oculto; no usar `compact` por estado de búsqueda |

#### Popover / sheet

| Part | Spec |
|------|------|
| Desktop | Portal → `#overlay-root`, bottom-end, offset 12px, width **420**, max-h `min(640px, 80dvh)`, radius 20; **one** bell owner on `lg+` (PanelTopbar / ClientFrameBar) |
| Mobile | Bottom sheet ≤**92dvh**; **one** bell owner below `lg` (MobileChromeHeader). Never mount both |
| Chrome | Header (title + unread chip + “Marcar todo como leído” + preferences gear) · Tabs Todos / Sin leer · scroll list · footer “Ver todos los avisos” → `/notifications` |
| Focus | Pointer open → dialog container (no ring). Keyboard open → first unread with **brand-green** `focus-visible` ring. No yellow rings on rows |
| Item anatomy | min-h 72, pad 12/16, radius 14. **Leading 40px tile** always: actor image **or** initials on brand-tint (`bg-primary/15` + primary text) **or** type icon tile (rounded-12). Type icon = 16px badge at bottom-right with 2px `ring-card` (never overlaps initials). Title 14 / body 13 clamp-2. Reservation codes → compact code chip (`tnum`, subtle surface, radius 6, shorten to last 6 + Tooltip). **Ver reserva** = h-32 px-12 pill, 12 semibold, brand text on brand-tint + 1px brand/20 border, mt-8. Time: relative ≤4 weeks; then short date `es-MX` (“28 jul 2026”) with relative in Tooltip. Unread tint + 8px green dot unchanged |
| Groups | Sticky Hoy / Ayer / Esta semana / Anteriores |
| States | Skeleton×5; empty Todos / Sin leer; error + Reintentar; offline banner; thin top progress |
| Keyboard | Enter/Space toggles bell; ↑↓ Home/End; Esc → bell; `m` toggles read |

#### Type → icon / tint

| Type / sub | Icon | Tint |
|------------|------|------|
| reservation (default) | calendar | brand |
| reservation cancelled | alert | error |
| reservation reminder | clock | warning |
| review | star | warning |
| message | chat | brand |
| social / like | heart | error |
| social saved | user-plus | brand |
| payment | credit-card | brand |
| system | info | neutral |

#### Deep links

Resolver only emits existing routes: `/reservation/{id}`, `/group-sessions/{id}`, `/post/{id}`, `/profile/{id}`, `/links`. Unknown → no href (row is a button; opens `/notifications`). No chat route yet for `mensaje`.

#### Do not

- Per-component stats polling; badge inside the button overlapping the icon; emojis; hardcoded hex; blocking modal for avisos; auto mark-all-read on open; invent routes; inline Accept/Reject reservation in the popover (use “Ver reserva” until a dedicated action API UX exists)

### Menú de usuario

Canonical: `web/components/shell/UserMenu/` (`UserMenu`, `UserMenuItem`, `UserMenuGroup`, `ThemeSegmented`, `userMenuConfig`).

**Rule:** no duplicar items que ya están en la navegación principal (Favoritos, Reservas, Explorar…). **La identidad vive en el bloque de usuario del sidebar; el menú no la repite** (no avatar/name/email/badges block inside the card). Entry to account is the **Mi cuenta** row.

| Piece | Spec |
|-------|------|
| Trigger | `SidebarUserBlock` only (desktop sidebar + mobile drawer). Open tint on block; three-dot **rotate 90°** while open (180ms). `aria-haspopup="menu"` / `aria-expanded`. Shows avatar + name + role (not email). |
| Desktop panel | Portal (`HeaderPopover` → `#overlay-root` / `document.body`); width **320** (`min(320px, calc(100vw - 16px))`); radius **20**; card + border + `--user-menu-shadow`; pad **8** (first visible content = CUENTA). Pinned: open **up**, align **left**, offset **8**. Rail: open **right** of avatar, bottom-aligned. Collision flip/shift + height cap. |
| Mobile | Bottom sheet when **&lt;768px** or **coarse pointer + width &lt;900px**: width inset **12**, radius **24** top, drag handle (**8px** handle zone) then **8px** card pad before CUENTA; `env(safe-area-inset-bottom)`, dimmed `--color-scrim` backdrop. |
| Groups | Labels via spacing tokens (see **Espaciado**). **Cuenta:** Mi cuenta `/me`, Configuración `/notification-preferences`, Notificaciones `/notifications` (+ unread badge), Mi perfil público `/profile` + Mi negocio `/dashboard` (provider). **Ayuda:** Ayuda y soporte `/help`. **Apariencia:** `ThemeSegmented` (scroll body). **Sesión:** Cerrar sesión **pinned outside scroll**. Footer legal: Términos + Privacidad (hidden in medium/short tiers). Dividers only **between** groups / above logout — never above CUENTA. |
| Rows | `--menu-row-h` 44 / 40; inset 12; tile 32; icon↔label 12; trailing 16; hover tint + chevron; active dot (`aria-current`). |
| Theme segmented | `--menu-segment-h` 36 (short 32); margin-inline 12; 8px below Apariencia label; sliding indicator; `menuitemradio`. |

#### Espaciado

**Rules:** (1) **Un solo mecanismo por espacio: gap o margen, nunca ambos.** (2) **Top = bottom:** whitespace above the first group label equals whitespace below the footer links (±1px) via `--menu-pad` + label/footer paddings.

| Variable | Value | Where |
|----------|-------|--------|
| `--menu-pad` | 8px | Card padding (all sides); scroll body `padding-bottom`; sheet bottom = pad + `safe-area` |
| `--menu-row-h` | 44 / 40 / 44 coarse | Row + logout height |
| `--menu-row-gap` | 2px | Gap between rows in a group (`__rows`) |
| `--menu-group-gap` | 8 / 6 / 4 (tall/med/short) | Divider `margin-block` only (group ↔ divider ↔ group) |
| `--menu-inset` | 12px | Row pad-x; divider inset; segment margin-inline; label pad-x |
| `--menu-label-h` | 24px | Group label box; margin `4px 0 2px` (first label same 4px top) |
| `--menu-segment-h` | 36 / 32 short | Theme control height |
| `--menu-tile` | 32px | Icon tile |
| `--menu-icon-gap` | 12px | Tile ↔ label |
| `--menu-trailing` | 16px | Chevron slot |
| Logout zone | — | Divider (no block margin); then `padding-top: 4px` on session group; row same as others |
| Footer links | — | `padding: 8px 12px 4px`; sep `·` with `margin-inline: 8px` |
| Sheet handle | — | `margin: 8px auto`; bar 4×40 |

| Piece | Spec |
|-------|------|
| Motion | Open 180ms scale/opacity/translateY (`--sidebar-ease-out`); `transform-origin` from placement; row stagger 20ms (max 100); reduced-motion opacity 100ms. Position set in `useLayoutEffect` (`visibility: hidden` until ready). |
| A11y | `role="menu"` with `aria-label="Menú de cuenta de {name}"` (or `"Menú de cuenta"`); scroll body `tabindex={-1}` `aria-label="Menú de cuenta"`; groups `aria-label`; arrows Home/End + `scrollIntoView({block:"nearest"})`; typeahead; Esc → focus trigger; Tab closes; outside click closes; close on route change + logout start; scroll resets to top on open. |

#### Posición y responsive

| Rule | Spec |
|------|------|
| Portal | Always `createPortal` → overlay root; `position: fixed`; `z-shell-overlay` (above sidebar + floating panel). **Never** depend on sidebar `overflow`. |
| Collision margin | **8px** from visual viewport edges (`window.visualViewport` when available). |
| Placement | **Pinned / expanded:** prefer **above** trigger (`bottom` of card = trigger top − 8). **Rail:** prefer **right** of trigger, card bottom aligned to trigger bottom. |
| Flip | If preferred side lacks space (&lt; ~160px useful), flip to the opposite side. |
| Height cap | If neither side fits full natural height, keep best side and set `--menu-max-h` = available space. Formula: `max-height: min(calc(100dvh - 16px), var(--menu-max-h))` with `--menu-max-h ≤ --menu-natural-height`. Natural-height floor **200px** (content-measured; shorter without identity block). |
| Shift (horizontal) | Clamp `left` so the card stays fully inside the viewport (±8px); never negative under the sidebar edge or past the right edge. |
| Listeners | `resize`, `scroll` (capture), `orientationchange`, `visualViewport` resize/scroll — **passive**; cleaned up on close. |
| Internal layout | Flex column: **scroll body** (`flex:1; min-height:0; overflow-y:auto; overscroll-contain`; thin themed scrollbar; top/bottom fade masks only when scrollable) + **footer zone (fixed)** with **Cerrar sesión**. **El botón Cerrar sesión siempre visible** — never inside the scroll container. |
| Width | Default **320px**; `min(320px, calc(100vw - 16px))` on narrow viewports. |
| Height tiers | **Tall (≥720px):** row 44, group gap 8. **Medium (560–719px):** row 40, group gap 6; hide legal footer. **Short (&lt;560px):** row 40, group gap 4; group labels hidden (dividers kept); theme control h-32. Zoom 100–200% and larger text reduce effective height → same media queries engage. |
| Touch | `(pointer: coarse)` keeps `--menu-row-h: 44px`; rely on body scroll instead of shrinking targets. |
| Sheet | `&lt;768px` **or** coarse + width `&lt;900`. Full width − 12 side margins; bottom-anchored; radius 24 top; `max-height: min(85dvh, 640px)`; drag handle + 8px pad → CUENTA; backdrop; body scrolls; logout pinned above safe area. Close: backdrop, Escape, route change. Page scroll locked (`overflow: hidden` on `html`/`body`) while open. |
| Landscape phones | `height &lt; 480px` + `orientation: landscape`: sheet becomes **right-aligned side panel** (`width: min(360px, 100vw - 24px)`, full height minus safe areas); same internal layout. |
| Checklist widths | 320 · 360 · 390 · 768 · 1024 · 1280 · 1440 · 1920 |
| Checklist heights | 480 · 560 · 640 · 720 · 800 · 900 (+ sidebar pinned / rail / floating) |

#### Modo oscuro (UserMenu)

**Rule:** las superficies elevadas en oscuro son más claras que el fondo, nunca más oscuras.

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--color-surface-elevated` / `--user-menu-surface` | `= card` white | `#24382c` (+6 vs page/frame `#0f1a14`) | Card / sheet fill |
| `--color-border-subtle` / `--user-menu-border` | card-border | cream @ 10% | Hairline edge |
| `--shadow-popover` | soft cream-tinted | deep layered + 1px ring | Elevation over frame |
| `--user-menu-highlight` | none | cream @ 8% inset top | Depth highlight |
| `--user-menu-row-hover` / tile | muted @ 10% | cream @ 6–7%; tile hover secondary @ 18% | Rows |
| `--user-menu-segment-track/thumb` | muted track / card thumb | recessed darker track; raised thumb + border | Theme control |
| `--user-menu-danger` / `-bg` | error / error-light | error `#e57373`; bg error @ 12% | Cerrar sesión |
| `--color-scrim` | fg @ 40% | bg @ 60% | Sheet backdrop |
| Focus ring | `--color-secondary` (brand yellow) | same | Rows + logout (chosen over red focus for consistency) |

**Contrast (approx. on elevated `#24382c`):** primary cream text ~12:1; secondary `#a8c4b0` ~7:1; group labels use secondary (~7:1, ≥4.5); logout error on hover tint ≥4.5; focus yellow on elevated ≥3:1 for non-text.

Theme switch: `data-theme-switching` on `<html>` (~50ms) disables UserMenu surface transitions (no flash).

Sidebar user block `active` when `isAccountPath(pathname)`.

---

## 6f. Explorar y filtros

Canonical: `web/app/(app)/explore/page.tsx` (thin composition), `web/features/explore/` (`useExploreResults`, selection store), `web/components/explore/` (`ExploreSearchHeader`, `ExploreFiltersColumn`, sheet, `ExploreSplit` workspace, `ExploreMap` OverlayView markers, media `ResultCard`).

### Anatomía (ASCII)

```
[ Shell panel = full-bleed MAP ]
  Glass topbar floats over map (search · location · rail)
  Floating Filtros badge (top-left) → expands in place to a compact card; collapses via chevron / Listo / Esc
  Full-width results sheet (bottom):
    collapsed → handle + “N resultados”
    expanded  → sort + scrollable ResultCards
  Filter sheet overlays when opened
Map fills the shell; page scroll locked; list scrolls inside the float panel.
```

**Map always visible:** zero results, loading, and provider API errors do **not** unmount the map. Empty/error for results render **below** the map. Compact map pill “Sin resultados en esta zona” only after a settled successful zero-result response.

**Map rendering strategy (chosen):** local JSON `styles` on a **RASTER** map. **Never** set `mapId` (cloud vector styles ignore JSON `styles`). Markers = HTML `OverlayView` (compatible without Advanced Marker / Map ID). Hex only in `exploreMapStyles.ts`. Theme via `data-theme` + `prefers-color-scheme` → `setOptions({styles})`. No CSS filters on the map tile layer. External dependency: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` only (no Maps Dashboard mapId).

**Scroll ownership:** shell scroll is locked on Explorar. The map fills the panel. Infinite-scroll root = `.nabbi-explore-float__panel-body`. Topbar + results float over the map.

**Search ownership:** Topbar `SearchBar` + `LocationPill` own `q` / location on `/explore` (same `useAppSearchQuery` contract: min 2, 300ms, URL). Cmd/Ctrl+K focuses the topbar input. No in-page duplicate search field.

### Container breakpoints (Explore workspace CQ)

Filters are **hidden by default** and open as a minimal sheet (no persistent left column). Main content is always full width.

Map host height (independent of result count / % parent height):

| Width | Height |
|-------|--------|
| ≥1280px | `clamp(480px, 60dvh, 680px)` |
| ≥900px | `clamp(440px, 58dvh, 620px)` |
| &lt;900px | `clamp(340px, 52dvh, 480px)` |

Results grid CQ on the **results** container (not the viewport): 1 col &lt;520 · 2 cols 520–819 · 3 cols ≥820 (cap 3).

Page gutter: 24 desktop / 16 narrow; `--explore-page-max` 1760px via `:has(.nabbi-explore)`. Bottom pad 24 + safe-area.

### URL / preference migration

| Legacy | Behavior now |
|--------|----------------|
| `?view=lista` | Parsed then **normalized to `mapa`**; map stays mounted |
| `?view=mapa` / absent | Default `mapa` |
| `sessionStorage nabbi:explore-map:v1` `view:"lista"` | Read path forces `mapa`; writes always persist `mapa` |
| “Vista de mapa” filter switch | Removed — map is not optional in the layout |
| Desktop list-only default | Removed |

`view` remains in the type/URL for compatibility but **must not** hide the map.

### Filter application

| Surface | Behavior |
|---------|----------|
| Default | Hidden — only a quiet **Filtros** chip in the toolbar |
| Sheet (all breakpoints) | Draft snapshot on open; **Aplicar** commits atomically; close discards; Restablecer clears draft |
| Sort | Results toolbar only (not duplicated in filters) |

Functional filters only: Tipo, Categorías, Cerca de mí, Distancia (1/5/10/25). No price/amenities/guests; `EXPLORE_SUBCATEGORY_FILTER=false`; `EXPLORE_RATING_FILTER=false`.

### Map states

| State | UI |
|-------|----|
| Loading SDK | Map-sized skeleton in host |
| Ready | Styled raster map + controls |
| Missing API key | Same-sized accessible error panel (list continues) |
| SDK failure | Same-sized error + Reintentar (host stays) |
| Results fetching | Map mounted + small “Buscando…” pill |
| Provider API error | Map stays; results area shows its own error |
| Settled zero results | Map stays + pill “Sin resultados en esta zona” |

### Frame / sticky offsets

| Token | Valor | Uso |
|-------|-------|-----|
| `--explore-page-max` | 1760px | Wide container via `:has(.nabbi-explore)` |
| `--bar-h` | 64px | Panel topbar |
| `--explore-bottom-inset` | 16px | Clears panel corner |
| `--sticky-offset` (`.nabbi-explore`) | ~48px | Card scroll-margin |

Page pad: 32 (≥1280 center), 24 (768–1279), 16 (&lt;768).

### Controls scale

| Control | H | Radius | Notes |
|---------|---|--------|-------|
| Sort / Filtros | 40 | full | count badge accent |
| Map zoom / locate / expand | 44 | 14 (zoom card) | glass panel 92% + blur; 12px inset |
| Auto-search pill / search-here | 40 | full | BC / TC |
| Popup primary / heart / directions | 40 | full / circle | |

Concentric radii: panel 28 → card 20 → tile 14 → control 12 → pills full.

### Results (below map)

Toolbar: “N resultados” (tabular; skeleton while loading) + sort listbox (Relevancia / Mejor valorados / Más cercanos; distance disabled without location). Media cards: image 16/10, heart TR, type chip BL, “Ver en el mapa” when map configured. Click → `/profile/{id}`; hover syncs marker. Empty/error compact **below** map — never replaces the workspace/map.

### Layout / map chrome

Expand map: hides filters + results temporarily (Esc exits; not persisted). No key / SDK error: same-sized panel inside map host — **never** silent list-only. Markers: circular pin with ring; clusters; user accent-text dot. Selection popup OverlayView-anchored (docked on narrow). FitBounds on `resultsGeneration` when `!userMovedMap`.

#### Mapa: tokens de modo oscuro

Rule: **los marcadores nunca dependen solo del relleno verde oscuro** (accent-fill `#1F3328` vs land is 1.33:1). Visibility comes from rings / halos / yellow selection.

| Elemento | Token / literal | Valor | Contraste | Estado |
|----------|-----------------|-------|-----------|--------|
| Contenedor mapa (tiles load) | `--surface-card` | `#191B1A` | vs panel 1.04:1 → **border** `--hairline-strong` (white 14%) + inset highlight | Pass (borde) |
| Land / label stroke | `EXPLORE_MAP_DARK_HEX.land` | `#191B1A` | — | Pass |
| Parks | `.parks` | `#1A2420` | decorative | Pass |
| Water | `.water` | `#1B2923` | — | Pass |
| Minor / major roads | `.roadMinor` / `.roadMajor` | `#2E3231` / `#3A3F3D` | 1.4:1 / 1.7:1 vs land (decorative; major lighter) | Pass |
| Place labels | `.label` | `#8E9390` | 5.7:1 land; 4.9:1 water | Pass |
| City / highway labels | `.labelMajor` | `#A9AEAB` | 7.9:1 | Pass |
| Marker ring (default) | `--color-foreground` | `#ECEEED` | 15.3:1 vs land | Pass |
| Marker ring (selected) | `--color-secondary` | `#F6C531` | 11.0:1 | Pass |
| Marker fill | `--accent-fill` | `#1F3328` | 1.33:1 — **ring required** | Fail alone / Pass with ring |
| Cluster fill | `--accent-fill-hover` | `#254031` | ring carries visibility | Pass with ring |
| Cluster ring / halo | `--accent-text` @100% / 16% | `#8CC4A0` | 8.9:1 ring | Pass |
| Cluster count | `--color-foreground` | `#ECEEED` | ≥4.5:1 on fill | Pass |
| User dot | `--accent-text` + ring `--color-foreground` | `#8CC4A0` / `#ECEEED` | ring ≥3:1 | Pass |
| Controls / pills / popup | `--surface-raised` 92% + `--hairline-strong` + `--shadow-float` | `#212423` | 1.14:1 fill → border+shadow | Pass |
| Buscar en esta zona | secondary / secondary-fg | `#F6C531` / `#12211A` | 10.3:1 | Pass |
| Focus ring (controls) | `--accent-text` | `#8CC4A0` | ≥3:1 non-text | Pass |

### ResultCard (media)

Image-first only (row/tile aliases deprecated for Favoritos compat). Favorite + map actions = siblings of the profile `Link` (not nested). Hide price/rating_count/hours when absent.

### Location mode (mutually exclusive)

| Mode | URL | Fetch geo | Clears |
|------|-----|-----------|--------|
| `none` | (no nearby, no zona) | — | — |
| `nearby` | `nearby=1` | shell coords + radiusKm | clears `zona` |
| `mapArea` | `zona=lat,lng,radioKm` (3 decimals, radius 1–50) | zona coords | clears nearby |

Inline notice when switching nearby ↔ mapArea. Chip “Zona del mapa” removable.

### Request lifecycle → UI

| Flag | When | UI |
|------|------|----|
| `loading` | First load / empty reset | Skeletons |
| `refetching` | Filter change with existing rows | 2px progress under FilterBar; list opacity 0.6 |
| `loadingMore` | Pagination | Bottom skeletons; no scroll reset; no fitBounds |

AbortController + monotonically increasing request id; ignore superseded responses. Debounce: chips/URL 150ms, radius 250ms, topbar `q` 300ms (min 2). Sort is page-local (no refetch).

### Map behavior

- Gestures: split = cooperative (Ctrl/Cmd+wheel; hint 1.2s); narrow Mapa / expanded = greedy.
- Markers: diff by id; max 200; hover tip 150ms (fine pointer only); selection z-index top.
- Clustering (pure TS `clusterMarkers.ts`): >60 markers and zoom <13 → dark halo bubbles; click fits bounds; off at zoom ≥13.
- Fit bounds: only on `resultsGeneration` change and `!userMovedMap`; pad 48; maxZoom 15; single → zoom 14.
- Popup: auto-pan + OverlayView pixel anchor; Esc closes + focus return; docked on narrow.
- “Buscar en esta zona” after meaningful move (idle 400ms); “Buscar al mover el mapa” pill (sessionStorage, 600ms / 1.5s min).
- Controls: zoom card 44 (+/−), locate 44, expand 44 (desktop); `disableDefaultUI`.
- Memory: `sessionStorage nabbi:explore-map:v1` (center/zoom/selectedId/view/listScrollTop), TTL 30m, gated by filter signature.
- ResizeObserver → resize preserving center; map instance reused; style swap live without re-init.

### Motion

| Motion | Duration |
|--------|----------|
| Type / Lista\|Mapa thumb | 200ms |
| Chip check scale-in | 120ms |
| Card hover / image zoom | 150ms |
| Heart pop | 200ms |
| Selection popup | 160ms |
| Active-filters height | 180ms |
| Expanded map | 220ms opacity |

Reduced motion: no transforms, pulses, or shimmers.

### URL params

| Param | Meaning |
|-------|---------|
| `q` | Topbar search (≥2 chars) |
| `category` / `categories` | One / multi |
| `sub` | Parsed; UI gated off |
| `type` | PROFESSIONAL \| PLACE |
| `sort` | relevance \| rating \| distance |
| `nearby` | `1` (exclusive vs `zona`) |
| `zona` | `lat,lng,radioKm` mapArea |
| `view` | Legacy `lista`\|`mapa`; always normalized to `mapa` (map never hidden) |

### A11y / live regions

Results `<ul>/<li>`; map `role=region` + skip links (filtros / mapa / listado); “Ir a resultados” on narrow; aria-live: count (500ms), zona aplicada, ubicación on/off; Esc clears selection / exits expand; touch targets ≥44px hit area. No Lista|Mapa tablist — map is always in the layout.

### Casos de prueba manuales

1. Chip seleccionado hace scroll horizontal; flechas mueven categorías; progress al filtrar; dim en vez de flash; Limpiar → Deshacer.
2. Cerca de mí denegado: ayuda inline, sin toast loop; radio 1/5/10/25 con debounce.
3. Desktop: scroll de página no zoomea el mapa; Ctrl+rueda sí; card → pan fuera del panel; tooltip hover.
4. Pan → Buscar en esta zona; toggle auto-search; chip Zona; never nearby+zona.
5. >60 resultados zoom bajo → burbujas; click zoom-in.
6. Back desde perfil restaura mapa/scroll; Lista|Mapa sin tiles grises.
7. Light/dark setOptions sin re-init; reduced motion; teclado/skip link.

### Pendientes backend (OUT OF SCOPE)

- Expose `sub_categories` on list serializer → enable `EXPLORE_SUBCATEGORY_FILTER`
- Server-side sort; multi-category query param
- `price` / `rating_count` / nested `professional_profile_id` \| `place_profile_id` on list (favorites add from explore)
- Optional `getNearby` / `getRecommendations` on page

**Do not:** second free-text search; cosmetic categories; ship subcategory control while no-op; hex outside `exploreMapStyles.ts` + token defs; viewport `sm|md|lg` in explore components (container queries only).

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
| **`DESIGN_SYSTEM.md` (this file)** | Brand, tokens, type, components, forms, a11y, App Shell |
| `web/FRONTEND_STANDARDS.md` | Next.js structure, features, TS patterns |
| `mobile/MOBILE_STANDARDS.md` | Expo structure, categories domain, RN patterns |
| `web/docs/THEME_SYSTEM.md` | How ThemeProvider / CSS variables work (implementation) |

---

## 14. Estado de implementación y deuda de UI conocida

### Estado (shell web autenticado)

| Área | Status | Canonical path |
|------|--------|----------------|
| Frame + panel + scroll-premium | Done | `AppShell.tsx`, `globals.css` (`.nabbi-shell-*`) |
| Sidebar pin / peek / cookie / drawer | Done | `Sidebar/*`, `shell-config.ts` (`nabbi_sidebar=pinned\|unpinned`, rail 76) |
| Mobile burger (no bottom nav) | Done | `SHOW_MOBILE_BOTTOM_NAV=false`, `MobileChromeHeader` |
| PanelTopbar / MobileChromeHeader | Done | `AppHeader.tsx` |
| SearchBar leftward expand + mobile morph | Done | `SearchBar/*`, `globals.css` (`.nabbi-search-*`) |
| LocationPill + LocationPopover + store | Done | `Location/*`, `useLocationFilter.tsx` |
| NotificationsBell + popover + provider | Done | `Notifications/*`, `features/notifications/` |
| OverlayProvider + `#overlay-root` | Done | `overlay/*`, `HeaderPopover.tsx` |
| UserMenu | Done | `UserMenu.tsx` |
| UI kit (Card, Badge, Avatar, …) | Done | `web/components/ui/*` |
| Breadcrumbs | **Hecho** | `BreadcrumbBar` / `PanelTopbar` |
| Explorar FilterBar redesign | **Hecho** | `ExploreFilterBar` + dialog; rail opt-out `/explore`; split ≥960 |
| Switch primitive shared | Done | `web/components/ui/Switch.tsx` (+ settings + LocationPopover) |

### Deuda de UI conocida (verificado en código)

| # | Hallazgo | Evidencia |
|---|----------|-----------|
| a | Explorar FilterBar: “Más” en dialog sigue CustomMultiSelect (aceptable en avanzados) | `ExploreFilterDialog` |
| b | ~~Duplicado nearby~~ mitigado: FilterBar on-state + active chip “Cerca · n km” (removable) | FilterBar |
| c | Columna mapa sigue montada con lista vacía/error → mapa “vacío” visual | `mapColumn` + split siempre renderizan `ExploreMap` |
| d | `/notification-preferences` = hub Configuración (UserMenu); Mi cuenta still has Preferencias/Seguridad tabs | `features/settings/` + ACCOUNT_ROUTES |
| e | Indicador Next.js (dev) puede solapar el user block del sidebar — solo desarrollo | entorno Next, no producto |
| f | ~~explore sticky magic~~ → `--bar-h` / `--filter-bar-h` / `--explore-map-sticky-top` | `globals.css` |
| g | Sin breadcrumbs; el prompt de diseño las menciona pero el Topbar usa título | — |
| h | ~~Location switch inline~~ → usa `ui/Switch` | `LocationPopover.tsx` |

---

## 15. Registro de cambios (Changelog)

### 2026-11-24 — Estilos: reglas de Tailwind (web)

Obligatorio para Configuración y cualquier página nueva:

1. **Clases estáticas** — nunca construir classNames con template literals / concatenación (`grid-cols-${n}`, `` bg-${tone} ``). Usar strings completos o `Record<Variant, string>` con el nombre entero.
2. **Containers** — todo `@min-[…]` / `@container` query necesita un ancestro con `container-type: inline-size` (`@container` / `@container/name` o CSS `container-type` + `container-name`).
3. **`@source`** — directorios nuevos fuera del scan automático deben registrarse en `web/app/globals.css` (`@source "../features/**/*.{…}"`, etc.). `tailwind.config.js` `content[]` es legacy y **no** se usa sin `@config`.
4. **Tokens en ambos temas** — cada `var(--…)` / utilidad semántica (`bg-card`, `text-foreground-muted`, `shadow-popover`) debe existir en light **y** dark en `@theme` / `:root` / `[data-theme="dark"]`.
5. **Sin hex en features** — hex solo en `globals.css` (definición de tokens). No `bg-green-500` ni `rgb()`.
6. **Inline style** — solo para CSS custom properties de runtime (`--indicator-x`, `--indicator-w`).

**Checklist de estilos (páginas nuevas):** clases estáticas · tokens light+dark · container declarado · `@source` si el dir es nuevo · sin CSS modules huérfanos · hojas scoped (`nb-*`) importadas **una vez** desde `globals.css` (justo tras `@import "tailwindcss"`) · reiniciar `.next` tras cambios grandes de CSS.

### 2026-11-24 — Configuración layout R1–R6 + item responsiveness

Canonical: `web/features/settings/` · `SettingsSectionGrid` (`stack`|`grid`) · `SettingsCard` (`span` auto|full) · `SettingsRow` · route `/notification-preferences`. Page container **`max-width: 72rem`** (igual Mi cuenta/Favoritos), centrado.

**Reglas de layout**
| # | Regla |
|---|--------|
| R1 | Secciones stack: cada card **width 100%**; sin `max-w-*` / caps en cards. `max-w-prose` solo en texto si hace falta. |
| R2 | Grid solo con 2+ peers; CQ 1 / 2 (≥700) / 3 (≥1500 si ≥5); list-like / danger / channels → `span=full`. |
| R3 | Huérfanos: en CSS compartido, 2-col `:last-child:nth-child(odd){1/-1}`; 3-col `:nth-child(3n+1):last-child` full y `:nth-child(3n+2):last-child` span 2. Peers bajo un span-full usan `.nabbi-settings-grid__peers`. |
| R4 | Columnas iguales, `align-items: start`, gap 20px; DOM = teclado. |
| R5 | Un solo contenedor de página (72rem); sin wrappers más estrechos dentro de tabs. |
| R6 | Toda sección usa `SettingsSectionGrid`; sin wrappers ad hoc. |

**Tabla por tab**
| Tab | Layout | Spans |
|-----|--------|-------|
| Notificaciones | grid | Channel `full` + peers grid (grupos); note dentro del channel |
| Preferencias | grid (≥2 cards) / stack (1) | peers; huérfano R3 |
| Seguridad | grid si Acceso+Sesiones peers (≤2 filas sesiones); else stack | Sesiones `full` si &gt;2 filas (+ Acceso `full` para no dejar media fila) |
| Privacidad y datos | stack (1 card hoy) | full width |
| Cuenta | **stack** | Cuenta + Zona delicada ambas full width |

**Card = container** (`container-type: inline-size; container-name: settings-card`). Filas/header/segmented reaccionan al **ancho de card**, no solo al de página.

**Item responsiveness**
| Pieza | Comportamiento |
|-------|----------------|
| SettingsRow | grid 36/1fr/auto; &lt;420px card: controles `wide` debajo del texto (full, min 44); Switch siempre a la derecha; título wrap opcional (`titleWrap`); desc clamp 2→1 |
| Sesiones | stack de acción &lt;480px card (`--stack-md`) |
| Header | action `compact` (Activar todo) queda en fila; `wide` envuelve &lt;420 |
| Segmented / radio chips | fit-content ≥480 card; full equal &lt;480 |
| Dialog / drawer | bottom sheet &lt;sm; panel `min(440|480px, 100vw-32)`; footer stack &lt;420 |
| Save bar | content-aligned; stack &lt;480; pb 96 + safe-area |
| Ultra-wide | container 72rem centrado; máx 3 cols |

**Checklist de tab nuevo**
1. `SettingsSectionGrid` con `layout="stack"|"grid"` (nunca wrapper ad hoc).
2. Cada card: `span="auto"|"full"`; sin `max-w-*` / `capped` / `mx-auto` en la card.
3. Si hay un span-full + peers → `SettingsPeersGrid` para los peers (huérfanos R3).
4. Filas vía `SettingsRow` (`control`: switch|wide|badge); targets ≥44px.
5. Card es `@container settings-card`; no depender solo del page container.
6. Tokens light+dark; hover solo en `@media (hover: hover)`; reduced-motion.
7. Probar 360 / 768 / 1440 / 1920: stack full-width, grid 2/3, sin huérfanos medios.

### 2026-11-24 — Página Configuración premium rebuild

Canonical: `web/features/settings/` · route `/notification-preferences` · URL `?seccion=<id>`. Estilos `.nabbi-settings-*` + tokens. **Cap 880px eliminado (2026-11-24 layout pass).**

| Pieza | Spec |
|-------|------|
| Frame | PageHeader compact “Configuración”; rhythm 28/20/24; `max-width: 72rem`; gap 20px; pb 96 con save bar. |
| Tab bar / chips / master-detail | sin cambio de breakpoints 1024 / 640–1023 / &lt;640. |
| SettingsCard | surface + hairline + radius 20; head con `action`; **sin capped**. |
| SettingsRow / Switch / channel / groups / save bar / motion / dark | ver tablas arriba + rebuild previo. |
| Removed | Left nav; **880px single-card cap**. |

### 2026-11-23 — Página Configuración (settings hub) — histórico

Primera llegada del hub (tabs + grid). Sustituida por el rebuild 2026-11-24 arriba.

### 2026-11-23 — Configuración > Seguridad / Preferencias

- **Seguridad:** rows gated by caps; password drawer = Dialog sheet; strength meter; sessions push-tokens.
- **Preferencias:** `useTheme` + `useLocationFilter`; client prefs `nabbi.client-prefs.v1`.

### 2026-11-23 — ReservationRow mobile / container queries

- row-compact / stack / wide; touch chevron + guarded hover; TabbedCard h-scroll fades + flush list panel; DesignSystem mobile checklist.

### 2026-11-23 — ReservationRow + StatusBadge shared

- `components/reservations/`: statusConfig, StatusBadge, ReservationRow; Avatar fallbacks use only brand tokens (fix bare initials); Mi cuenta + `/reservations` + dashboard pills use StatusBadge.

### 2026-11-23 — Mi cuenta premium refinement

- AccountSummary two-zone + radial tint (no clipped strip); KpiCard premium (neutral numerals); compact period control; TabbedCard sliding indicator + counts; FilterChip 32px hairline; ReservationRow inset dividers/chevron/avatar 24.

### 2026-11-23 — PageHeader compact on Mi cuenta only

- `variant`: `legacy` (default, en transición) | `compact` (Mi cuenta) | `banner` (Feed). Condensed topbar title only when chrome=`compact`. Other pages keep legacy eyebrows/subtitles.

### 2026-11-23 — PageHeader compact + condensed topbar title

- Infrastructure: `usePageTitleVisibility` + PanelTopbar condensed title; Feed `banner`. Full migration deferred — only Mi cuenta uses `compact`.

### 2026-11-23 — Mi cuenta CLIENT polish

- Full-width AccountSummary + EditProfileSheet; KpiCard×4 (no fake %); period `?periodo=` + estado chips; tabs Preferencias/Seguridad; `accountVariants` config; DesignSystem AccountSummary/KpiCard.

### 2026-11-23 — UserMenu spacing scale

- `--menu-pad` / `--menu-row-h` / `--menu-group-gap` / …; single-mechanism dividers; top=bottom visual equality; DesignSystem **Espaciado**.

### 2026-11-23 — UserMenu drop identity header

- Removed in-menu identity block (`UserMenuHeader`); CUENTA is first; header-only tokens/CSS deleted; a11y label `Menú de cuenta de {name}`; natural-height floor 200.

### 2026-11-23 — UserMenu collision + responsive

- Portal collision (flip/shift/height cap via `visualViewport`); flex layout with scroll body + pinned logout; height density tiers; sheet &lt;768 / landscape side panel; DesignSystem **Posición y responsive**.

### 2026-11-23 — UserMenu dark elevation

- `--color-surface-elevated`, `--shadow-popover`, `--color-border-subtle`, `--color-scrim`; UserMenu dark tokens (header/badges/rows/segment/danger); `data-theme-switching` flash guard.

### 2026-11-23 — UserMenu premium redesign

- Split `UserMenu/`; removed Favoritos; config-driven Cuenta/Ayuda; ThemeSegmented sliding indicator; header identity card; rail opens to the side; no nav duplicates.

### 2026-11-24 — ProfileHero rebuild (nb-profile-*)

**Root cause (unstyled hero):** layout/typography lived as `.nabbi-profile-*` appended to the end of an 8.9k-line `globals.css`. **Fix:** dedicated `profile-hero.css` imported once right after `@import "tailwindcss"`, prefix `nb-profile-*`, `data-variant`.

#### Compact spacing (2026-11-24)

**Rule:** el hero usa gap del contenedor, no márgenes por hijo (`--nb-profile-body-gap`, `--nb-profile-meta-gap`, `--nb-profile-id-gap`).

| Part | Expanded | Compact row (h&lt;760) | Rail 72 |
|------|----------|------------------------|---------|
| Hero padding (t / x / b) | 8 / 12 / 4 | 8 / 12 / 4 | 8 / 0 / 8 |
| Avatar / ring outer | 64 / 72 | 48 / 56 | 36 / 44 |
| Ring + gap | 2px + 2px | same | same |
| Presence dot | 10 | 10 | 8 |
| Glow | 112 | 80 | hidden |
| Name | 15/20 semibold; body gap 8 | body gap 10 | — |
| Identity | one row, gap 6; chip h20 pad 0 8 | same, left-aligned | tooltip |
| Stats mt / py | 10 / 6 | 8 / 4 | hidden |
| Stat number / label | 14 / 11, lh 1.15, gap 0 | same | — |
| Dividers | 20 tall | same | — |
| Menu | 28 visual / 44 hit; top 4 right 4 | same | below avatar |
| Hero divider mb | 4 (inset 12) | 4 | none |
| Nav `--sidebar-nav-pt` | 8 | 8 | 8 |
| ~Hero height (w/ stats) | ~190 | shorter row | avatar only |

Landmark, focus order, stats rules, tokens, and CSS delivery unchanged from the rebuild. **Never** show bio/city/status/email/phone.

#### Stats por rol (existing hooks only)

| Role | Stats shown | Sources |
|------|-------------|---------|
| CLIENT | Reservas, Favoritos | `useAccountReservations`, `useFavorites` |
| PROFESSIONAL / PLACE | Reservas (+ Reseñas/Seguidores/Publicaciones **when** a shared count exists) | same reservations hook; extras omitted until available (row hidden if &lt;2) |

#### Variants × viewport

| Sidebar mode | h&lt;640 | h 640–759 | h≥760 |
|--------------|--------|-----------|-------|
| Expanded / float / mobile drawer | compact, avatar 48, **no** stats/glow | compact, avatar 48, stats on | full, avatar 64, stats on |
| Collapsed rail 72 | avatar 36 / ring 44, tooltip, no stats/text | same | same |

#### Tokens (both themes)

`--profile-ring`, `--profile-glow` (accent α ~14%), `--profile-ring-gap` (= frame bg). Reuse `--glass-1`, `--hairline-dark-surface`, `--shell-on-frame`, `--color-secondary`.

#### CSS delivery

Utilities (static strings / complete `Record` values) + **scoped** `profile-hero.css` (`nb-profile-*`). Reduced motion: no ring scale/angle. Reduced transparency: no glow/shadow.

### 2026-11-24 — PanelSurface + ProfileHero (initial)

- **PanelSurface:** shared chrome for center / Centro social (docked, mini, overlay, drawer). Root: `overflow: clip` + `isolation` + radius; **1px hairline is an overlay** (`.nabbi-panel-surface__border`, `pointer-events: none`) so children cannot cover corners. Content padding ≥16px sides / 24px bottom.
- Breadcrumb separator: `ChevronRightIcon` (12px), not a text glyph.

### 2026-11-24 — Dark theme = neutral near-black + green accent

- Dark canvas no longer forest green: frame `#0C0D0D`, panel `#121413`, card `#191B1A`, raised `#212423`, hover `#292C2B`.
- Green is accent only (`--accent-fill` / `--accent-text`); yellow CTA unchanged; light theme untouched.
- `color-scheme: dark` + `meta theme-color` via ThemeProvider; hairlines white-alpha; shadows black-alpha.

### 2026-11-24 — Shell polish (minimalist / futurista)

- **Connected-tab deprecated & removed** (cream connector, concave curves, icon tiles).
- Active nav = `--glass-2` pill + shared sliding yellow indicator (`SidebarNavIndicator`, SSR fallback).
- Spacing `--space-1..8`, radii `--r-panel/card/tile/ctl`, derived `--glass-*`, `--hairline-*`, `--glow-accent`, `--shadow-panel/float`, `--shell-on-frame`.
- Sidebar 264 / 72; recents follows nav (`mt-6`); topbar borderless → glass on scroll; explore split lista+mapa (≥960 CQ) with FilterBar; `/explore` rail opt-out; Centro social shares panel surface.
- See Shell → Spacing / SidebarItem / Responsive matrix above.

### 2026-11-23 — Floating peek transition + lockup 0.85

- Float card always mounted (`data-open`); BrandLockup mark 27 / word 17 / gap 5 (`--brand-scale: 0.85`). *(Open motion updated 2026-11-24 to 180ms.)*

### 2026-11-23 — Sidebar modes + animation gate *(superseded 2026-11-24)*

- `data-sidebar-mode` retained; connected-tab keyframes removed.

### 2026-11-23 — Sidebar active = connected tab *(superseded 2026-11-24)*

- Replaced by glass pill + sliding indicator.

### 2026-11-23 — BrandLockup fix (crop + 6px gap)

- Root cause: PNG empty margins made glyphs ~half the CSS height and ~25px visual gap. Alpha-cropped `icon`/`text`; mark 32 / word 20 / `--brand-gap: 6px`; rail left-aligned mark-only.

### 2026-11-23 — BrandLockup (no tile, larger)

- Sidebar/header/drawer: bare mark + word; `on-dark` → `/logo/white/`; `BrandLockup` API; tile CSS removed.

### 2026-11-23 — Sidebar header↔nav 1px divider

- `--sidebar-divider` + `.nabbi-sidebar__nav-divider` (inset 12px, outside scroll); padding `--sidebar-nav-pt` below the line.

### 2026-11-23 — Sidebar: optional PRINCIPAL label + nav top padding

- PRINCIPAL unlabeled in sidebar (`label` optional); `breadcrumbLabel` / `NAV_SECTION_LABELS` keep “Principal › …”. `--sidebar-nav-pt: 20px` on `.nabbi-sidebar__nav`. NEGOCIO label + rail divider unchanged.

### 2026-11-23 — Favoritos in PRINCIPAL + standalone page

- Nav: Favoritos after Reservas (`/favorites`, heart) for all roles. Page: PageHeader, type/sort toolbar, ResultCard grid + heart undo toast; `useFavorites` shared. Mi cuenta tab → compact preview + “Ver todos los favoritos”.

### 2026-11-23 — CUENTA out of sidebar → UserMenu

- Removed sidebar **CUENTA** section (Mi cuenta, Configuración, Ayuda, perfil público). Metadata in `ACCOUNT_ROUTES`; breadcrumbs via `getAccountRouteByHref`. UserMenu owns account links + Apariencia; user-block `active` ring/dot on account paths.

### 2026-11-23 — Mi cuenta premium (CLIENT) + role architecture

- `features/account`: registry CLIENT/PRO/PLACE; ProfileCard, StatCard+MiniBars, TabbedCard (`?tab=`), StatusChip, ReservationRow/FavoriteRow; CLIENT completo; PRO/PLACE stubs. Tabs tone `brand` for panel.

### 2026-11-20 — Página Mi cuenta responsive

- `/me`: PageHeader “Mi cuenta”, grid por container queries, AccountRow/GroupCard, `roleLabelEs`, stats, sin feed duplicado; PRO/PLACE “Tu negocio” → perfil público.

### 2026-11-20 — Frame seam fix (single paint)

- `--shell-frame-bg` (highlight + vignette + linear) solo en el FRAME; sidebar surface transparente; peek/drawer `background-attachment: fixed` viewport-aligned. Eliminadas costuras del radial en el sidebar.

### 2026-11-20 — Pin icon refinement

- `SidebarPinIcon` inline (Heroicons sin push-pin); 20px; unpinned outline 45° white/70 vs pinned filled yellow CTA; tooltip con keycap `[`; `aria-keyshortcuts`.

### 2026-11-20 — Sidebar pin model + burger drawer

- Reescrito §6b Sidebar: **pinned / unpinned rail 76 / peek float 272** (`--sidebar-w` estable en peek); pin hover-only; delays 120/220; z-peek 45; groups + PLACE Negocio; cookie `pinned|unpinned` + legacy map.
- Mobile: burger + drawer; avatar quitado del header; `SHOW_MOBILE_BOTTOM_NAV=false`.
- Eliminado del documento/código: `SidebarToggle` «, edge handle, collapse cookie values, bottom-nav as default.

### 2026-11-20 — Sync documento ↔ shell web final

- Documentado App Shell actual: frame/panel tokens, `CLIENT_USES_SIDEBAR=true`, overlays (`#overlay-root`, un owner/id), SearchBar slot+absolute (sin compactar pill/bell), Location 400px / band 88 / one yellow CTA, Notifications badge corner + poll 60s, sin breadcrumbs.
- Corregido checklist de QA (crecimiento izquierda; sin compactación por búsqueda).
- Añadidos TOC, estado de implementación y deuda de UI (Explorar filtros/mapa/chips, nav Configuración, magic z-index).
- Eliminadas contradicciones: compactación por `data-search-active`, breadcrumbs como hechas, palette como búsqueda.

---

**Last updated:** 2026-11-23 — Mi cuenta CLIENT polish (code = source of truth).
