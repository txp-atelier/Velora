# Velora Style Guide

Design system reference for the Velora ecommerce application.

## Brand

- **Name:** Velora (replaces ShopZone)
- **Tagline:** Shop Smart, Live Better
- **Voice:** Plain language, helpful, human — no jargon or lorem ipsum

## Color System

Every semantic color is a step on a full 50–900 scale (`--primary-*`, `--accent-*`, `--success-*`, `--warning-*`, `--error-*`, `--gray-*` in `client/src/index.css`), so hover/soft-background/active states are always a different step of the *same* ramp instead of an ad hoc lighter/darker guess. Semantic tokens (`--color-primary`, `--color-accent`, `--color-text`, `--color-border`, etc.) resolve to a specific step and are what components actually use.

### Light Mode
| Token | Resolves to | Usage |
|-------|-------|-------|
| `--color-bg` | `--gray-50` | Page background |
| `--color-bg-alt` | `#F4F1FC` | Alternating/tinted section bands |
| `--color-surface` | `#FFFFFF` | Cards, modals, navbar |
| `--color-primary` | `--primary-800` | Brand, links, structural UI |
| `--color-accent` | `--accent-500` | CTAs: Add to Cart, Buy Now, offers |
| `--color-primary-soft` / `--color-accent-soft` | `--primary-50` / `--accent-50` | Tinted backgrounds (selected states, icon chips) |
| `--color-success` / `--color-warning` / `--color-error` | `-600` / `-500` / `-600` step | Status, ratings, errors |
| `--color-text` / `--color-text-secondary` | `--gray-900` / `--gray-500` | Copy |

### Dark Mode
Same token names, remapped to lighter steps on each scale (e.g. `--color-primary` → `--primary-400`) so contrast holds — see the `[data-theme="dark"]` block in `index.css`.

There is no manual theme toggle. `ThemeContext` reads `prefers-color-scheme` on load and listens for OS-level changes, so the app always matches the device's color mode.

## Scrollbars

Themed globally via `scrollbar-color`/`scrollbar-width` (Firefox) and `::-webkit-scrollbar` (Chrome/Edge/Safari) in `index.css` — a thin, rounded, border-colored thumb on a transparent track, no browser-default scrollbar anywhere (page, modals, drawers, the filter sidebar's internal scroll).

## Typography

- **Display/headings:** `--font-display` = Sora (600–800 weight), loaded via Google Fonts in `index.html`. Applied globally to `h1`–`h6`.
- **Body/UI:** `--font-sans` = Inter (400–700 weight).
- **Type ramp:** `--text-display` (hero, clamp 2–2.75rem) · `--text-h1` (clamp 1.625–2.125rem) · `--text-h2` (clamp 1.375–1.625rem) · `--text-h3` (1.25rem) · `--text-h4` (1.0625rem) · `--text-body-lg` (1.0625rem) · `--text-body` (0.9375rem) · `--text-caption` (0.8125rem). H1/H2 use `clamp()` so they scale fluidly with viewport instead of needing per-breakpoint overrides.

## Spacing Scale

Strict 4px base — do not use one-off margin/padding values.

| Token | Value | Legacy alias |
|-------|-------|-------|
| `--space-1` | 4px | `--space-xs` |
| `--space-2` | 8px | `--space-sm` |
| `--space-3` | 12px | — |
| `--space-4` | 16px | `--space-md` |
| `--space-6` | 24px | `--space-lg` |
| `--space-8` | 32px | `--space-xl` |
| `--space-12` | 48px | `--space-2xl` |
| `--space-16` | 64px | `--space-3xl` |

## Elevation Scale

`--shadow-xs` (resting card/panel) → `--shadow-sm` (hover) → `--shadow-md` (lifted card, dropdown) → `--shadow-lg` (drawer) → `--shadow-xl` (modal). Redefined per theme (dark mode uses black-based shadows at higher opacity, since the light-mode navy shadows disappear on dark surfaces). Prefer shadow-based depth over borders-only — every card/panel now has a resting `--shadow-xs` by default.

## Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Buttons, inputs, badges, chips |
| `--radius-md` | 14px | Cards |
| `--radius-lg` | 18px | Large panels, home banner spotlight |
| `--radius-xl` | 22px | Modals |
| `--radius-full` | 999px | Pills, avatars, circular icon buttons |

## Motion

One easing curve, three durations — avoid ad hoc transition values.

| Token | Value |
|-------|-------|
| `--ease` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` (badge/cart bump) |
| `--duration-fast` | 150ms |
| `--duration-base` | 200ms (aliased as `--transition`, used by most hover/focus states) |
| `--duration-slow` | 300ms (image zoom/fade, card lift) |

## Icon Set (Lucide React)

| Context | Icon |
|---------|------|
| Search | `Search` |
| Cart | `ShoppingCart` |
| Wishlist | `Heart` |
| Account | `User` |
| Carousel | `ChevronLeft`, `ChevronRight` |
| Categories | `Smartphone`, `Shirt`, `Home`, `Sparkles`, `Dumbbell`, `BookOpen` |
| Add to cart | `ShoppingCart` |
| Buy now | `Zap` |
| Reviews | `Star`, `ThumbsUp`, `MessageSquare` |
| Seller | `Store`, `Package`, `Plus`, `Pencil`, `Trash2` |
| Empty states | `PackageOpen`, `SearchX`, `ShoppingBag` |
| Upload | `Upload`, `Image`, `X` |
| Checkout | `CheckCircle`, `CreditCard`, `Smartphone` |
| Filters | `SlidersHorizontal` |

**Rules:** Lucide React only. No emojis. No default browser arrows.

## Copy Replacements

| Old (ShopZone) | New (Velora) |
|----------------|--------------|
| ShopZone | Velora |
| $79.99 | ₹6,499 |
| "Failed to fetch" | "Could not load products. Please try again." |
| Login wall redirect | Friendly modal: "Sign in to add items to your cart" |
| Lorem ipsum | Real, helpful copy in empty states |

## Components

Reusable React wrappers live in `client/src/components/ui/` — every page should build forms and actions from these rather than raw `<button>`/`<select>`/`<input>` tags, so hover/focus/active/disabled states stay consistent everywhere:

| Component | Wraps | Notes |
|-----------|-------|-------|
| `Button` | `.btn-{variant}` | variants: `primary`, `accent`, `outline`, `ghost`, `danger`; `to`/`href` render as links; `loading` shows a spinner |
| `IconButton` | `.icon-btn` | icon-only, requires `label` (→ `aria-label`); optional `badge` count |
| `Input` / `Textarea` | `.field-input` / `.field-textarea` | label, `error`/`hint` text, red border + message on error |
| `Select` | `.select-wrap` | native `<select>` restyled with a custom chevron, full keyboard a11y |
| `Checkbox` / `Radio` | `.checkbox` / `.radio` | visually-hidden native input + styled sibling box |
| `RadioCard` | `.radio-card` | selectable card (payment method, signup role picker) |
| `Card` | `.card` | shared surface: border, radius, padding |
| `Badge` | `.badge-pill` | variants: `default`, `accent`, `primary`, `success`, `warning`, `error`, `info` — used for order status and labels |
| `Modal` | `.modal-overlay` / `.modal` | fade + scale open animation, Escape/backdrop close, becomes a bottom sheet under 480px |
| `Drawer` | `.filter-drawer` | right-side slide-in panel with animated backdrop, used for mobile filters |
| `ConfirmDialog` | `.confirm-dialog` | styled destructive-confirmation modal — use instead of `window.confirm()` anywhere in the app |

- **Focus:** every interactive element gets a visible `:focus-visible` ring (`--color-primary` outline) — do not suppress it.
- **Skeleton loaders:** Shimmer animation on listing/detail pages
- **Empty states:** Icon + title + message + action button (via `EmptyState`)
- **Modals:** Auth flows preserve page context (no redirect); built on the shared `Modal` component above
- **Micro-interactions:** product image zoom + fade-in on hover/load (`.product-card-image img`), cart icon "bump" on add (`.badge.bump` / `.icon-btn.bump`), card hover-lift (`translateY` + shadow step-up)
- **Section rhythm:** `Section` (Home) accepts a `tinted` prop → `.home-section.tinted` gives alternating sections a soft `--color-bg-alt` band so the page doesn't read as one flat column; `cardBadge` prop surfaces a "Trending"/"Best Seller" pill (`.card-badge-pill`) on cards within that section only — presentational, no new data fields

## Currency

All prices use **INR (₹)** with Indian locale formatting: `₹1,299` via `formatINR()`.

## Accessibility

- WCAG AA contrast in both themes
- No default blue links — use `--link-color` (primary brand)
- `aria-label` on icon-only buttons
- Focus states via border/hover on interactive elements

## Onboarding Tooltips

Stored in `localStorage` as `velora_onboarding_{id}`:
- `add_to_cart` — first add to cart
- `seller_first_product` — first seller product form

Dismissible with "Got it" or X.
