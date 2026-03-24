# ITman Website v2

Personal portfolio and resume website for Sam Itman — IT Innovation Specialist, Cybersecurity Professional, and Project Manager.

## Hosting

Static website hosted on **AWS S3**. No build step, server-side rendering, or backend required. All files are served as-is. CDN propagation may take a few minutes after deploying changes.

## Tech Stack

- **HTML** — Single-page site (`index.html`)
- **CSS** — Custom styles in `css/styles.css` (no frameworks)
- **JavaScript** — Vanilla JS in `js/main.js` (no frameworks)
- **Fonts** — Google Fonts CDN (Space Grotesk + DM Sans)
- **No build tools** — No npm, webpack, or bundlers

## Design

- **Color theme:** Teal (`#09786c` primary, `#0db19f` light) on dark background (`#0a0e1a`)
- **CSS custom properties** for consistent theming (`--primary`, `--bg-dark`, etc.)
- **Responsive** with breakpoints at `968px` and `640px`
- **Mobile hamburger menu** with slide-in panel
- **Floating glassmorphism nav** — detaches from edges on scroll with rounded corners and backdrop blur
- **Channel-routed PCB circuit board** canvas background with mouse/touch interaction
- **3D tilt effect** on profile photo with animated conic-gradient border
- **Scroll-triggered reveal animations** via Intersection Observer
- **Scroll progress bar** with glow effect
- **Infinite logo marquee** — JS-driven recycling conveyor with edge fade masks, full-color logos
- **Mouse-following glow** on expertise cards
- **Magnetic button effect** — buttons subtly pull toward cursor
- **Animated resume timeline** with vertical line that draws on scroll
- **Staggered skill tag entrance** animations
- **Background gradient orbs** with slow float animation
- **Film grain texture** overlay
- **Cursor-following ambient glow** (desktop only)
- **`prefers-reduced-motion`** fully respected for accessibility
- **Mobile-optimized** — touch events, reduced canvas complexity, no GPU-heavy effects on mobile

## Project Structure

```
index.html                      # Main HTML (single page)
css/styles.css                  # All styles
js/main.js                      # All scripts
documents/
  SamItmanResume.pdf            # Downloadable resume
images/
  ITman-Logo.svg                # Site logo (transparent SVG, used in nav only)
  favicon.png                   # Browser favicon
  webclip.png                   # Apple touch icon
  professional_photo.png        # Hero section photo (+ p-500, p-800 variants)
  article1.jpg                  # Featured content image (+ p-500)
  article2.jpg                  # Featured content image (+ p-500)
  githubImage.jpg               # Featured content image (+ p-500, p-800, p-1080)
  DOW_logo.png                  # Organization logo — Dept of Air Force Warfighter
  USSF_delta_logo.png           # Organization logo — Space Force delta
  USSF_Logo.png                 # Organization logo — USSF
  USSF_S6_png.png               # Organization logo — USSF S6
  DAF_logo.png                  # Organization logo — Dept of Air Force
  cisa_logo.png                 # Organization logo — CISA
  OptumLogo.png                 # Organization logo — Optum / UnitedHealth Group
  KIPPlogo.png                  # Organization logo — KIPP New Jersey
```

## Page Sections

1. **Hero** — Name, title, credentials, CTA buttons, profile photo with 3D tilt and animated gradient border
2. **Organizations** — Infinite scrolling logo marquee: DOW, USSF, DAF, CISA, USSF S6, USSF Delta, Optum, KIPP
3. **Expertise** — Three cards with mouse-follow glow: IT Innovation, Project Management, Cybersecurity
4. **Resume** — Animated timeline with experience (5 roles), Education (NJIT), Technical Skills grid with staggered tag animations
5. **Featured Content** — Three cards linking to articles and GitHub
6. **Footer** — Contact info, social links (no footer logo — nav logo is always visible via floating nav)

## Key Notes

- **All images use responsive `srcset`** for optimized loading
- **Logo is an SVG** (`images/ITman-Logo.svg`) with transparent background — "IT" in teal, "man" in white
- **Resume content is rendered as HTML** in the Resume section; PDF is available for download
- **No external JS/CSS dependencies** besides Google Fonts CDN
- **S3 compatible** — fully static, no server-side requirements
- **PDF links** point to `documents/SamItmanResume.pdf` (two download buttons: hero section and resume section)
- **External links:** LinkedIn (`samuel-itman`), GitHub (`samitman`), Email (`samuel.itman@gmail.com`)

## Layout Notes

- **Logos marquee:** JS-driven recycling conveyor belt (`js/main.js`). A single set of `<img>` elements inside `.logos-marquee`; JS clones them at startup to fill the container width + buffer. Each logo is `position: absolute` and moved left via `translate3d` on every animation frame (0.6px/frame). When a logo's right edge exits the left boundary, it's repositioned after the rightmost logo — creating a seamless infinite loop with no overflow. Container is capped at `max-width: 1200px` to match content width. CSS `mask-image` gradient fades logos in/out at both edges (transparent → black 12% → black 88% → transparent). Logos display at full color (`opacity: 0.85`, no grayscale filter), `opacity: 1` on hover. Pauses on `mouseenter`. Respects `prefers-reduced-motion` (falls back to static flex wrap layout). Mobile (640px): logos 80px height, container 100px.
- **Cards:** Semi-opaque dark backgrounds (`rgba(10,14,26,0.75)`) with `backdrop-filter: blur(12px)` and `-webkit-backdrop-filter: blur(12px)` for readability over the circuit background.
- **Skills grid:** Flexbox with centered wrapping — 3 cards top row, 2 cards bottom row centered.
- **Featured cards:** Flexbox columns with `margin-top: auto` on arrow links to align them at the bottom regardless of content height.
- **Section spacing:** `80px` vertical padding on sections, `60px` hero bottom, `50px` logos section.
- **Footer:** Single-column layout on mobile (968px breakpoint). No footer logo.

## Circuit Board Background

Canvas-rendered PCB-style circuit board background (`js/main.js`, first IIFE).

- **Channel-routed traces:** Traces snap to a grid (14px spacing desktop, 18px mobile) and route with clean horizontal/vertical segments connected by 45° chamfered bends. An occupied-channel tracker prevents any two traces from overlapping.
- **Convergence pattern:** Traces originate from all four screen edges and route inward toward the center, creating an organized radial pattern.
- **IC chip blocks:** Small rectangular components with internal pin-pad dot grids, scattered across the canvas.
- **Junction nodes:** Glowing dots with outer rings at trace bends, small dots at endpoints.
- **Data pulses:** Animated light dots that travel along entire routes (multi-segment). Speed range is slow and calm (0.001–0.003). Max 20 pulses desktop, 8 mobile.
- **Mouse/touch interaction:** Traces and junctions glow brighter within a 300px radius of the cursor.
- **Seeded PRNG:** Deterministic layout using a seeded random number generator (seed 7919) so the pattern is consistent across page loads.
- **Mobile optimization:** Fewer traces (30 vs 60), fewer chips (4 vs 10), wider grid spacing, no `shadowBlur`, fewer/slower pulses.
- **Rebuilds on resize** to fill the new viewport dimensions.
