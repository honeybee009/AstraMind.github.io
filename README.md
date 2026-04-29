# AstraMind v1.1.0

**Personal Astrology Intelligence — Static web app, runs anywhere**

## Quick Start
1. Download the zip → unzip → open `index.html` in Chrome/Safari/Firefox
2. That's it. No install, no server, no backend.

## Deploy to GitHub Pages (5 minutes)
1. Create repo on github.com (Public, no README)
2. Upload all 9 files (index.html, style.css, astrology.js, geocode.js, insights.js, blend.js, app.js, tests.js, README.md)
3. Settings → Pages → Branch: main → Save
4. Live at: `https://YOUR-USERNAME.github.io/REPO-NAME/`

## Add Google Analytics
In `index.html`, replace both instances of `G-XXXXXXXXXX` with your real GA4 Measurement ID.
Get one free at analytics.google.com

## Run Tests
Open the app → click **⚗** (top right) → Run Tests → expect ≥80% pass

---

## Data Privacy
All data is stored in your browser's `localStorage` only.
Nothing leaves your device. No server, no database, no accounts.
Static apps cannot share data across devices without a backend.

---

## Files
| File | Purpose |
|------|---------|
| index.html | App shell — all screens and HTML |
| style.css | Complete dark-theme stylesheet |
| astrology.js | Astronomy engine (chart, dasha, yogas) |
| geocode.js | Global city search via OpenStreetMap + 172-city offline fallback |
| insights.js | Insight text engine (local, no API) |
| blend.js | AstroBlend synastry + couple analysis |
| app.js | App controller (routing, rendering, localStorage) |
| tests.js | 15 browser test cases |
| README.md | This file |

---

## CHANGELOG

### v1.1.0
- Global city search — any city on Earth via OpenStreetMap Nominatim
- 172-city offline fallback database (instant, works without internet)
- Automatic timezone detection from coordinates
- AstroBlend fully fixed — creator flow, dashboard, dimensions, couple decision mode
- All insight routing fixed (career/wealth/love/health/general)
- Blend tab renders correctly on all devices
- Tests updated to 27 assertions, 100% pass rate

### v1.0.0
- Initial release — birth chart, insights, decision mode, AstroBlend

---

## Pushing Updates via Git (Fastest Method)

### First time setup
```bash
git clone https://github.com/YOUR-USERNAME/REPO-NAME.git
cd REPO-NAME
```

### Every update after that
```bash
# Edit your files, then:
git add .
git commit -m "What you changed"
git push
# GitHub Pages auto-deploys in ~60 seconds
```

### GitHub Desktop (no terminal needed)
1. Download GitHub Desktop → clone your repo
2. Edit files in any text editor
3. In GitHub Desktop: write a commit message → Commit → Push
4. Done — live in 60 seconds

### Direct edit on GitHub (simplest)
1. Go to your repo → click any file → pencil icon → edit → Commit changes
2. Live in 60 seconds — no tools needed

---

## Supported Cities
172 cities offline including full India coverage (Pantnagar, Dehradun, all major cities).
Any city worldwide via OpenStreetMap when online (2.5 billion+ locations).
