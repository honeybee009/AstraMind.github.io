# AstraMind — Personal Astrology Intelligence

**Version:** 1.0.0  
**Type:** Static web app (HTML + CSS + JS only)  
**Hosting:** GitHub Pages compatible

---

## What Is AstraMind?

AstraMind is a personal astrology intelligence app that generates real insights from your birth chart — not generic sun-sign horoscopes. It calculates your exact planetary positions using astronomical algorithms and produces personalized daily, weekly, and monthly readings.

**Key Features:**
- Birth chart calculation (Western/Tropical + Vedic/Sidereal)
- Personalized daily, weekly, monthly insights
- Decision Mode — ask your chart any life question
- AstroBlend — relationship intelligence for two people
- 50+ city database including Indian cities
- All data stored locally (no backend, no server)

---

## Data Privacy Model

> **Important:** This is a static web app. All user data is stored in your browser's `localStorage` only.

- Data **never leaves your device**
- No user can access another user's data
- Clearing browser data or localStorage will erase all profiles
- Each browser/device has its own isolated data

**Limitation:** Static apps cannot centrally store or view user data without a backend. If you want shared profiles across devices, a backend database is required (not included in this version).

---

## File Structure

```
astramind/
├── index.html      ← App shell, all screens and HTML structure
├── style.css       ← Complete stylesheet (space-dark theme, responsive)
├── astrology.js    ← Astronomical calculation engine (chart, dasha, yogas)
├── insights.js     ← Insight text generation engine (local, no API)
├── blend.js        ← AstroBlend synastry and couple analysis engine
├── app.js          ← App controller (routing, rendering, state, persistence)
├── tests.js        ← Browser-based test suite (15 test cases)
└── README.md       ← This file
```

---

## Running Locally

1. Download or clone all files into one folder
2. Open `index.html` in any modern browser (Chrome, Safari, Firefox, Edge)
3. No server needed — it works directly from the file system

---

## Deployment: GitHub Pages (Step by Step)

### Step 1 — Create a GitHub Account
Go to [github.com](https://github.com) and sign up if you don't have an account.

### Step 2 — Create a New Repository
1. Click the **+** button → **New repository**
2. Name it: `astramind` (or any name you prefer)
3. Set visibility to **Public**
4. Do NOT initialize with README (you already have files)
5. Click **Create repository**

### Step 3 — Upload Files (Beginner Method — GitHub UI)
1. On the empty repository page, click **"uploading an existing file"**
2. Drag and drop ALL your files:
   - `index.html`
   - `style.css`
   - `astrology.js`
   - `insights.js`
   - `blend.js`
   - `app.js`
   - `tests.js`
   - `README.md`
3. Scroll down, add a commit message: `Initial release v1.0.0`
4. Click **Commit changes**

### Step 4 — Enable GitHub Pages
1. Go to your repository → **Settings** tab
2. Scroll to **Pages** in the left sidebar
3. Under **Source**, select **Deploy from a branch**
4. Choose branch: `main`, folder: `/ (root)`
5. Click **Save**
6. Wait 1–2 minutes for deployment

### Step 5 — Access Your Live URL
Your app will be live at:
```
https://YOUR-USERNAME.github.io/astramind/
```
Replace `YOUR-USERNAME` with your GitHub username.

### Step 6 — Add Google Analytics Tracking ID
1. Go to [analytics.google.com](https://analytics.google.com)
2. Create a new property → get your **Measurement ID** (format: `G-XXXXXXXXXX`)
3. Open `index.html`
4. Find both instances of `G-XXXXXXXXXX` and replace with your real ID:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR-REAL-ID"></script>
   <script>
     gtag('config', 'G-YOUR-REAL-ID');
   </script>
   ```
5. Save and re-upload `index.html` to GitHub

### Step 7 — Run the Test Suite
1. Open your live app
2. Click the **⚗** button in the top-right corner of the app
3. Click **▶ Run Tests**
4. You should see ≥80% pass rate

---

## Updating the App (How to Make Changes)

### Beginner Method — GitHub UI
1. Go to your repository on GitHub
2. Click on the file you want to edit (e.g., `style.css`)
3. Click the **pencil icon** (Edit this file)
4. Make your changes
5. Scroll down → click **Commit changes**
6. GitHub Pages automatically redeploys within 1–2 minutes

For uploading a new version of a file:
1. Go to repository → click **Add file** → **Upload files**
2. Upload your updated file(s)
3. Commit — existing files with the same name get replaced

### Advanced Method — Git CLI
```bash
# Initial setup (do this once)
git clone https://github.com/YOUR-USERNAME/astramind.git
cd astramind

# After making changes to files:
git add .
git commit -m "Description of what you changed"
git push origin main
# GitHub Pages deploys automatically
```

---

## Test Suite Details

**Location:** `tests.js`  
**How to run:** Click ⚗ button in app → Run Tests  
**Pass threshold:** 80%

| # | Test Name | What It Checks |
|---|-----------|---------------|
| 1 | Chart Calculation: Basic Output | Chart object has all required fields |
| 2 | Chart Calculation: Correct Western Signs | Arjun's Sun=Aquarius, Moon=Virgo, Rising=Aries verified |
| 3 | Chart Calculation: All 9 Planets | Sun through Ketu all present with valid data |
| 4 | Chart Calculation: 12 Houses | All houses have signs, lords, and meanings |
| 5 | Dasha Calculation: Active Period | Exactly one dasha marked as active |
| 6 | Dasha Progress: 0–100 range | Progress percentage is valid |
| 7 | Insight Engine: Decision Mode | decide() returns title, content, category |
| 8 | Insight Engine: Category Routing | Career/wealth/love/health questions route correctly |
| 9 | Insight Generation: Full Set | generateAll() returns ≥9 insights covering all categories |
| 10 | Blend Engine: createBlend Output | Full blend object with all required sections |
| 11 | Blend Dimensions: Valid Scores | All 5 dimensions have 0–100 scores and valid levels |
| 12 | Blend: Couple Decision Mode | coupleDecide() returns meaningful answers |
| 13 | localStorage: Persistence | Data survives write/read/delete cycle |
| 14 | Edge Cases: Empty Input | Engine handles nonsense/short/special-char questions |
| 15 | Data Integrity: Cities + Signs | Pantnagar in list, all 12 signs have traits |

---

## Supported Cities (50+)

**Uttarakhand:** Pantnagar, Dehradun, Haridwar, Nainital, Roorkee  
**North India:** Delhi, Noida, Gurgaon, Lucknow, Kanpur, Agra, Varanasi, Meerut, Chandigarh, Amritsar, Ludhiana, Patna  
**West India:** Mumbai, Pune, Ahmedabad, Surat, Nagpur, Bhopal, Indore  
**South India:** Bengaluru, Chennai, Hyderabad, Kochi, Thiruvananthapuram, Coimbatore, Mysuru, Visakhapatnam  
**East India:** Kolkata, Bhubaneswar, Ranchi, Raipur, Guwahati  
**Rajasthan:** Jaipur, Jodhpur, Udaipur  
**International:** New York, Los Angeles, Chicago, Houston, London, Dubai, Singapore, Sydney, Melbourne, Toronto, Paris, Frankfurt, Tokyo, Nairobi

---

## Astrology System

**Primary:** Western (Tropical) — what most people know from apps and newspapers  
**Secondary:** Vedic (Sidereal) — traditional Indian system, shifts signs back ~23°

The app uses Western as default. Toggle to Vedic on the Chart screen.

**Calculation method:**
- Julian Day Number for time conversion
- VSOP87-simplified Sun/Moon longitude formulas
- Lahiri ayanamsha for sidereal conversion
- Equal-house system for house division
- Vimshottari Dasha from Moon nakshatra
- Lahiri ayanamsha: ~23.85° for modern dates

---

## Browser Compatibility

| Browser | Supported |
|---------|-----------|
| Chrome 90+ | ✅ |
| Safari 14+ | ✅ |
| Firefox 88+ | ✅ |
| Edge 90+ | ✅ |
| iOS Safari | ✅ |
| Android Chrome | ✅ |

---

## Analytics Setup

The app includes Google Analytics 4 placeholder code. To activate:

1. Create a GA4 property at [analytics.google.com](https://analytics.google.com)
2. Copy your Measurement ID (`G-XXXXXXXXXX`)
3. In `index.html`, replace both instances of `G-XXXXXXXXXX` with your ID
4. Analytics is invisible to users — tracks page views and visits only
5. No admin panel is exposed in the app

---

## Deployment Checklist

- [ ] All 7 files uploaded to GitHub repository
- [ ] GitHub Pages enabled (Settings → Pages → main branch)
- [ ] App loads at `https://username.github.io/repo-name/`
- [ ] Can create a profile with birth details
- [ ] Insights generate correctly
- [ ] Chart screen shows correct signs (Western toggle)
- [ ] AstroBlend works with 2 profiles
- [ ] Decision Mode returns answers
- [ ] Test suite runs with ≥80% pass rate
- [ ] No console errors (check browser DevTools → Console)
- [ ] Google Analytics tracking ID replaced
- [ ] Mobile layout looks correct (test on phone)

---

## CHANGELOG

### v1.0.0 — Initial Release
- Birth chart calculation (Western + Vedic)
- 9 planetary positions with house placement
- Vimshottari Dasha period calculation
- Yoga detection (Gajakesari, Budhaditya, Hamsa, Malavya, Ruchaka)
- Daily, weekly, monthly insight generation
- Decision Mode — 8 question templates + custom input
- AstroBlend — synastry analysis for 2 profiles
- 5 compatibility dimensions with expandable detail
- Weekly & monthly couple horoscope
- Couple Decision Mode
- Multi-profile support (unlimited profiles per device)
- Bookmark system
- North Indian birth chart diagram (canvas)
- Western/Vedic toggle
- 50+ city database including Pantnagar, Uttarakhand
- 15-test browser test suite with pass/fail display
- Google Analytics integration (placeholder)
- Fully responsive (mobile, tablet, desktop)
- localStorage persistence (no backend required)

---

## Known Limitations

1. **Data is device-specific** — profiles don't sync across devices
2. **Retrograde calculation simplified** — exact retrograde dates require full VSOP87
3. **Birth chart diagram** — North Indian style only (Western wheel not included in v1)
4. **No birth time?** — Use 12:00 noon as default; Rising sign will be approximate
5. **City not in list?** — Pick the nearest city; results are accurate within ~100km

---

## Support

For updates, raise a GitHub Issue on your repository.  
For astrology questions — trust your chart. 🌙

---

*AstraMind v1.0.0 · Static web app · All data local to your device*
