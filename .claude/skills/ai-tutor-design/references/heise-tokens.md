# Where the heise values came from

Read this only when the palette or typeface is in doubt, or when the brand has
moved and the tokens in `SKILL.md` need re-deriving.

## How to re-derive

heise.de ships a single stylesheet with a themed token block per sub-brand
(`.theme-ct`, `.theme-ix`, `.theme-make`, …). The one that matters here is
`.theme-ho` — heise online, the front page. `<body>` also carries the utility
classes that set the page ground and default text colour.

```bash
curl -sL -A "Mozilla/5.0" https://www.heise.de/ -o heise.html
curl -sL -A "Mozilla/5.0" https://www.heise.de/assets/styles/index.css -o heise.css

grep -o '<body[^>]*>' heise.html                    # -> class="ho-text ho-page-bg"
grep -o 'font-family:[^;}]*' heise.css | sort -u
```

Then pull the `.theme-ho` block and the `.ho-*` utilities out of `heise.css`.

## What that yielded (September 2026)

`.theme-ho, .theme-newsticker`:

```
--brand-light: #0068C7
--brand: #0056A4
--brand-dark: #00407A
--brand-alternative-light: #f2f2f2
--brand-alternative-dark: #323232
--brand-text: #ffffff
--brand-link-hover-underline: #323232
--brand-branding: #0056A4
--brand-button: #464646
--brand-button-hover: #323232
--brand-button-text: #fff
--brand-button-accent: #464646
--brand-button-accent-hover: #323232
```

Body utilities:

```
.ho-text     -> color: rgb(50 50 50)     = #323232
.ho-page-bg  -> background: rgb(232 237 240) = #E8EDF0
.ho-bg       -> background: rgb(255 255 255)
```

Typography:

```
font-family: "Source Sans VF", system-ui, -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif
font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
             "Liberation Mono", "Courier New", monospace
```

Weights in use: 200, 400, 600, 700, 900. Letter-spacing: `.02em` and `.08em`
(the latter on uppercase nav labels, alongside `tracking-widest`).
Border radii in use: 0, 3px, 5px, 8px, 16px, 24px, 9999px — the small end
dominates; the large values belong to overlays and images.

`#E2001A` is heise's red. On heise online it is an alert/accent colour; several
sibling brands use it as their own `--brand-branding`.

## Two observations worth keeping

- **The buttons are not blue.** `--brand-button` is `#464646` on every heise
  theme sampled, including ones whose brand colour is a vivid red or cyan. The
  brand colour marks identity; the neutral marks action.
- **Panels are separated by the ground, not by borders.** `.ho-border` resolves
  to white, so the visible seam between two white blocks is the `#E8EDF0` page
  showing through the gap.
