# ESC Puzzle — Cardio Study Tool

A personal study app for cardiologists. Drag ESC-style guideline diagrams around
to rehearse the algorithms until they're muscle memory.

## What's in the box

- **3 study modes** for every chart:
  - **Algorithm** — scramble the steps, drag them back to the right spots on the diagram
  - **Label-drag** — drop labels onto anatomical targets (when you add `labels` to a chart)
  - **Piece-puzzle** — free-form rearrange with ghost outlines as guide
- **Anchor pins** — lock steps you know cold, focus on the ones you don't
- **3 seeded ESC charts** (built from your screenshots):
  - Diagnostic algorithm for heart failure (2021 ESC HF, Fig 1)
  - Management of SMVT in chronic CAD (2022 ESC VA, Fig 13)
  - Management of aortic regurgitation (2021 ESC/EACTS Valvular, Fig 5)
- **Builder** — paste the steps from any ESC figure, get a new puzzle
- **localStorage** — every chart persists, no server, no network
- **PWA** — install on phone or laptop, works offline

## Run locally

```bash
cd esc-puzzle
python3 -m http.server 8080
# open http://localhost:8080
```

Or just open `index.html` in a browser.

## Deploy

The app is 100% static. Drop the `esc-puzzle/` folder on any static host
(Netlify, Vercel, GitHub Pages, S3) and you're done.

## File structure

```
esc-puzzle/
├── index.html              # App shell, all 4 views (Library, Study, Builder, About)
├── styles.css              # ESC-calibrated design tokens
├── app.js                  # Drag engine, 3 modes, anchor system, persistence
├── sw.js                   # Service worker (offline + PWA install)
└── manifest.webmanifest    # PWA manifest
```

## Adding a new chart via the Builder

1. Tap **Builder**
2. Title: e.g. "AF 2024 — Stroke prevention (CHA₂DS₂-VASc)"
3. Source: e.g. "2024 ESC AF Guideline, Figure 3"
4. Mode: Algorithm / Label-drag / Piece-puzzle
5. Steps: one per line, in the order they appear in the figure
6. Save → opens in Study mode

For exact ESC node positions, the easiest path is to read the steps to me
(voice or text) and I'll add the x/y coordinates so the puzzle matches the
figure pixel-by-pixel.

## License note

The visual style mimics ESC guideline figures. The actual figures and
text content from ESC publications are © European Society of Cardiology.
This app is for personal study use only.
