# Flipwise

A personal, offline flashcard PWA for studying for any exam. Import a CSV of questions and answers,
study with Again / Hard / Good ratings, and track mastery by chapter and section.
No accounts, no backend, no analytics.
Cards and progress live only in the browser's IndexedDB on your device.

## Develop (Windows)

```
npm install
npm run dev          # http://localhost:5173
npm test             # unit + integration tests (Vitest)
npm run test:e2e     # end-to-end (Playwright: iPhone/WebKit + desktop Chromium)
npm run build        # production build in dist/
```

`npm run dev:lan` exposes the dev server on your Wi-Fi so you can check the layout on the iPhone.
Service workers (offline / install) need HTTPS, so test installation against the GitHub Pages URL.

## Deploy to GitHub Pages

Full step-by-step guide (repo `flipwise`, iPhone install, updates, troubleshooting): [instructions.md](instructions.md).

1. Create a repository on GitHub (public is fine: CSV files are git-ignored and never uploaded).
2. Push this folder:
   ```
   git add .
   git commit -m "Initial version"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` tests, builds and publishes to
   `https://<you>.github.io/<repo>/`. Every push to `main` redeploys; the app shows
   "A new version is available — Reload" when an update arrives.

## Install on iPhone

1. Open the GitHub Pages URL in **Safari**.
2. Share → **Add to Home Screen** → Add.
3. Open the app **from the Home Screen icon** and import your CSV there
   (Safari and the Home Screen app have separate storage).
4. After the first launch it works fully offline (airplane mode included).

Removing the app from the Home Screen deletes its data. Use **Settings → Export backup** occasionally
and keep the file in the Files app.

## CSV format

Header row with `Chapter, CardNumber, Section, Question, Answer` (any order, case-insensitive).
Save from Excel as **CSV UTF-8**. A card's identity is `Chapter` + `CardNumber`; progress follows that ID
across re-imports, so keep chapter names stable.

Any exam works: `Chapter` and `Section` are just two levels of grouping (e.g. "Domain 2: Security" / "Key Terms").
The app holds one card set at a time. Progress for cards that leave the set is kept hidden and returns if they come back,
so you can switch between exam CSVs. Prefix chapter names with the exam (e.g. "AWS – Chapter 1") so two exams'
"Chapter 1" never share IDs. The same trick lets you combine several exams in one CSV.

## Study rules

| Rating | Effect on card | In the current session |
|---|---|---|
| Again | Learning (Difficult stays Difficult), marked *missed*, streak reset | Returns after ~4 other cards |
| Hard | Difficult, streak reset | Returns once at the end of the queue |
| Good | Streak +1 (once per day; not on a day it was failed); Mastered at 3 by default; clears *missed* | Done |

Start Review picks: missed → difficult → learning → new → mastered cards not seen for 7+ days.

## Manual iPhone checklist

- [ ] Installs from Safari; launches full-screen with icon and name "Flipwise"
- [ ] Nothing hidden under the Dynamic Island or home indicator
- [ ] Import from Files app works; replace keeps progress
- [ ] Airplane mode: launch, study, filter chapters/sections, view progress
- [ ] Swipe the app away mid-session → reopen → "Resume session"
- [ ] Dark mode and text sizes are readable
- [ ] Export backup → Save to Files; Restore backup
