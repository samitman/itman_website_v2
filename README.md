# ITman Website v2

Personal portfolio and resume website for Sam Itman — IT Innovation Specialist, Cybersecurity Professional, and Project Manager.

## Hosting

Static website hosted on **AWS S3**. No build step, server-side rendering, or backend required. All files are served as-is.

## Tech Stack

- **HTML** — Single-page site (`index.html`)
- **CSS** — Custom styles in `css/styles.css` (no frameworks)
- **JavaScript** — Vanilla JS in `js/main.js` (no frameworks)
- **Fonts** — Google Fonts CDN (Inter + IBM Plex Sans)
- **No build tools** — No npm, webpack, or bundlers

## Design

- **Color theme:** Teal (`#09786c` primary, `#0db19f` light) on dark background (`#0a0e1a`)
- **CSS custom properties** for consistent theming (`--primary`, `--bg-dark`, etc.)
- **Responsive** with breakpoints at `968px` and `640px`
- **Mobile hamburger menu** with slide-in panel
- **Glassmorphism** nav bar (backdrop-filter blur on scroll)
- **Particle canvas** background with mouse interaction
- **3D tilt effect** on profile photo (CSS perspective transforms)
- **Scroll-triggered reveal animations** via Intersection Observer
- **Scroll progress bar** at top of page

## Project Structure

```
index.html                      # Main HTML (single page)
css/styles.css                  # All styles
js/main.js                      # All scripts
documents/
  SamItmanResume.pdf            # Downloadable resume
images/
  ITman-Logo.svg                # Site logo (transparent SVG, used in nav + footer)
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

1. **Hero** — Name, title, credentials, CTA buttons, profile photo with 3D tilt
2. **Organizations** — 4x2 logo grid: DOW, USSF, DAF, CISA, USSF S6, USSF Delta, Optum, KIPP
3. **Expertise** — Three cards: IT Innovation, Project Management, Cybersecurity
4. **Resume** — Experience (5 roles), Education (NJIT), Technical Skills grid
5. **Featured Content** — Three cards linking to articles and GitHub
6. **Footer** — Contact info, social links, logo

## Key Notes

- **All images use responsive `srcset`** for optimized loading
- **Logo is an SVG** (`images/ITman-Logo.svg`) with transparent background — "IT" in teal, "man" in white
- **Resume content is rendered as HTML** in the Resume section; PDF is available for download
- **No external JS/CSS dependencies** besides Google Fonts CDN
- **S3 compatible** — fully static, no server-side requirements
- **PDF links** point to `documents/SamItmanResume.pdf`
- **External links:** LinkedIn (`samuel-itman`), GitHub (`samitman`), Email (`samuel.itman@gmail.com`)

## Layout Notes

- **Logos grid:** 4 columns desktop, 2 columns mobile. Logos use `max-width` constraint to keep wide logos (Optum, KIPP) visually consistent with square/tall ones.
- **Skills grid:** Flexbox with centered wrapping — 3 cards top row, 2 cards bottom row centered.
- **Featured cards:** Flexbox columns with `margin-top: auto` on arrow links to align them at the bottom regardless of content height.
- **Section spacing:** `70px` vertical padding on sections, `40px` on hero bottom, `40px` on logos section.
