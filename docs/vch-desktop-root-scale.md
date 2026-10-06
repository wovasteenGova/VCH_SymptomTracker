# VCH large desktop root scale

Shared policy for **VCH ClaimBuilder**, **VCH Symptom Tracker**, and the **VCH marketing hub** (`www.veteranscentralhub.com`) so all feel readable on a typical 27" monitor at **100% browser zoom** (similar to 125% browser zoom before this change).

## Rules

| Viewport width | `html` font-size |
|----------------|------------------|
| Under 1536px | `100%` (browser default, usually 16px) |
| 1536px and up | `125%` (~20px root) |
| 2560px and up | `131.25%` (~21px root) |

## Where it lives

- **ClaimBuilder:** `app/assets/css/main.css` (on the `html` block)
- **Symptom Tracker:** `app/assets/css/main.css` (same media queries)
- **VCH hub:** global stylesheet on `html` (same media queries; snippet in ClaimBuilder `docs/vch-hub-large-desktop-root-scale.snippet.css`)

When you change breakpoints or percentages, update **all three** codebases and this doc.

## Notes

- Prefer **browser zoom at 100%**. OS display scaling is separate.
- Use **1536px**, not 1920px, as the first breakpoint. OS display scaling lowers CSS viewport width (for example 2560×1440 at 150% is about 1707px wide). A 1920px media query never runs on many 27" setups.
- Most Tailwind and Nuxt UI sizes use **rem**, so they scale with root font-size.
- Fixed `px` values do not scale; prefer `text-sm`, `text-xs`, or rem arbitrary sizes.
- Quick check in DevTools: `getComputedStyle(document.documentElement).fontSize` should be `20px` (or `21px` on very wide viewports) when scaling is active.
