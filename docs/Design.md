# Design

Visual language for FeesUp. Keep the UI clean, dark, and confidence-inspiring — a money tool
tutors trust at a glance.

## Brand
- **Name:** FeesUp
- **Tagline:** Collect. Track. Relax.
- **Logo:** "Fees" in white + "Up" in accent green, with a rounded green ₹ mark.

## Colour palette
| Token            | Hex       | Usage                                  |
|------------------|-----------|----------------------------------------|
| Background       | `#111111` | App background (black)                 |
| Surface          | `#1A1A1A` | Cards, table header, modals            |
| Border           | `#2A2A2A` | Dividers, input borders                |
| Accent           | `#00D97E` | Primary buttons, highlights, links     |
| Accent (dark)    | `#00B368` | Hover state for accent                 |
| Text             | `#FFFFFF` | Primary text (white)                   |
| Text muted       | white @ 40–70% opacity | Secondary text, labels    |

### Status colours
| Status   | Hex       | Meaning              |
|----------|-----------|----------------------|
| Paid     | `#00D97E` | green — paid         |
| Overdue  | `#F0453A` | red — overdue        |
| Pending  | `#F5B83D` | yellow — pending     |

Status badges use the colour at low opacity for fill + border with the solid colour for text
and a dot, so they read clearly on the dark surface.

## Typography
- **Font family:** Inter (with system-ui / sans-serif fallback), loaded via Google Fonts.
- **Weights:** 400 (body), 500 (labels/buttons), 600–700 (headings), 800 (logo / big numbers).
- **Scale:** page title ~24px bold; card values ~24px bold; body 14px; labels 12px uppercase
  with wide tracking and muted colour.

## Components & patterns (Tailwind, see frontend/src/index.css)
- `.card` — surface bg, subtle border, rounded-xl, padding.
- `.btn-primary` — accent bg, black text; `.btn-ghost` — bordered, transparent;
  `.btn-danger` — red outline for destructive actions.
- `.input` — dark field, accent focus ring; `.label` — muted uppercase caption.
- Summary cards: 2-up on mobile, 4-up on large screens.
- Table: surface header, hover row highlight, right-aligned action buttons.
- Modal: centered card over a 70% black scrim; click-outside to close.

## Layout & spacing
- Max content width ~`max-w-6xl`, centered, generous padding (`px-4 py-8`).
- Rounded corners: lg for inputs/buttons, xl for cards/containers.
- Consistent 4-based spacing (Tailwind defaults).

## Interaction & tone
- Friendly, respectful copy (this is about money between people the tutor knows).
- Reminder messages are polite and include student name, amount, month, and payment link.
- Prefer clear empty states (e.g. "No students yet. Click Add student to get started.").

## Accessibility
- Maintain sufficient contrast (accent/red/yellow on dark all pass for text sizes used).
- Buttons and icon-only controls have `aria-label`/`title`.
- Keyboard: forms submit on Enter; modal closable via the ✕ button.

## Responsiveness
- Mobile-first. Header condenses on small screens; summary grid and action buttons wrap.
- No native app — responsive web covers phone + laptop usage.
