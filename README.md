# ORBIT

A polished, dark games-and-apps portal with a built-in browser (proxy) and a
one-tap **cloak**. Built with **React + TypeScript + Vite**. The frontend is
fully static and deploys to **GitHub Pages**; the optional proxy backend is a
small Node service you host separately.

- **40+ games** — 22 are written into this repo and play right here; the rest
  open on their official websites.
- **22 app shortcuts** plus your own custom ones.
- **Browser** — an address bar + back/forward/reload/home that loads pages
  through a proxy backend you configure.
- **Cloak** — instantly swaps the whole portal for a working notepad, with a
  customizable tab title, favicon, and keyboard shortcut.
- Favorites, recently played, themes, and all settings are saved locally; you
  can export, import, or clear them.

---

## Quick start (local)

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install      # install dependencies
npm run dev      # start the dev server
```

Open the URL it prints (usually <http://localhost:5173>). The games, apps,
favorites, cloak, and settings all work immediately. The **Browser** page needs
a proxy backend — that part is optional (see [below](#the-browser--proxy)).

To make a production build and preview it:

```bash
npm run build    # type-checks, then builds into dist/
npm run preview  # serves the built site locally
```

---

## Deploy the frontend to GitHub Pages

This repo includes a workflow at `.github/workflows/deploy.yml` that builds and
publishes on every push to `main`.

1. Push this repository to GitHub.
2. In the repo, go to **Settings → Pages** and set **Source** to
   **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab).
4. Your site appears at `https://<your-username>.github.io/<repo-name>/`.

**Why it works under a subdirectory:** `vite.config.ts` sets `base: './'` (all
asset paths are relative) and the app uses a **hash router** (`#/games`,
`#/settings`, …), so no server-side redirects are needed and deep links never
404. A `.nojekyll` file is included so GitHub Pages serves every file as-is.

---

## The Browser / proxy

GitHub Pages can only host static files, so the browser needs a proxy backend
that you run yourself. Everything is in [`backend/`](backend/README.md).

```bash
cd backend
cp .env.example .env     # then set ACCESS_TOKEN to a long random value
npm install
npm start                # listens on :8080
```

Then in ORBIT go to **Settings → Browser backend** and enter:

- **Backend URL** — e.g. `http://localhost:8080` (or your deployed HTTPS URL)
- **Access token** — the `ACCESS_TOKEN` you set

Click **Test connection**. The **Browser** page's status dot turns green when
it can reach the backend.

**What the proxy can and can't do (honestly):** it fetches pages server-side,
strips `X-Frame-Options`/CSP so they can be framed, and rewrites links and
assets to route back through itself. It supports HTTPS and static assets. It
does **not** support WebSockets, form POSTs, or sites that build their URLs in
JavaScript at runtime — so many logged-in and single-page-app sites won't fully
work. For full fidelity, deploy an
[Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet) + Wisp stack
and point the Backend URL at it instead. The backend is protected with an
access token, per-IP rate limiting, size/time caps, and SSRF guards that block
requests to private/internal addresses. Details and deployment options (Docker,
Render, Railway, Fly.io, a VPS) are in [`backend/README.md`](backend/README.md).

The portal (games and apps) works fully **without** any backend — the Browser
page simply shows a clear "no backend / offline" state until you configure one.

---

## Games: "Play here" vs "Open official"

Each game card is labelled:

- **Play here** — a game bundled in this repo (`public/games/*.html`), played in
  an in-app player with full-screen, restart, a controls panel, and a
  return-to-library button. Loading failures show a retry.
- **Official site** — opens the game's official website in a new tab. ORBIT does
  not embed these or claim any embedding rights; it only links out. The links
  use each game's own canonical address (e.g. `slither.io`), plus two verified
  publisher pages (Cookie Clicker on `orteil.dashnet.org`, Moto X3M on its Poki
  listing). No ratings, player counts, or licensing permissions are invented.

Search, category filters, A–Z / category sorting, a random-game button, and a
recently-played row are all on the **Games** page.

---

## Cloak

The **Cloak** button (top bar) instantly replaces the visible portal with a
plain, working notepad. You can customize, in **Settings → Cloak**:

- the **tab title** shown while cloaked,
- the **favicon** (chosen from an emoji),
- the **keyboard shortcut** (default: the `` ` `` backtick key),
- an optional **quick-redirect** URL (adds a `↪` button that jumps straight to a
  site you choose).

On activation, bundled games and their audio are paused, and the Browser page
blanks its proxied frame to stop any sound (that page reloads when you restore,
so unsaved progress there is lost). Restore the portal with the small `●` button
in the notepad's corner or the shortcut.

**Accurate description:** cloaking only hides the visible interface on screen.
It does **not** erase your browser history or any network activity. Also, a
keyboard shortcut may not fire while a game or a proxied page has keyboard focus
or is full-screen — use the on-screen Cloak button then.

---

## Preferences & data

Favorites, recently played, theme/accent, cloak settings, the backend config,
and custom app shortcuts are stored in your browser's `localStorage` (nothing
is sent anywhere). In **Settings → Your data** you can **export** them to a JSON
file, **import** them back, **clear recents**, or **clear all data**.

---

## Add your own games & apps

Catalogs are plain data files — no UI code to touch:

- **Games:** `src/data/games.ts`. Add a `local(...)` entry (and drop a matching
  `public/games/<id>.html`) to play in-portal, or an `ext(...)` entry to link
  out to an official site.
- **Apps:** `src/data/apps.ts`. Add an `app(...)` entry. (End users can also add
  custom shortcuts from the **Apps** page at runtime.)

Thumbnails are generated automatically from each entry's id (a gradient plus a
category glyph), so there are no external images to manage and nothing can fail
to load.

---

## Project structure

```
.
├─ index.html                 # Vite entry
├─ vite.config.ts             # base: './' for GitHub Pages subdirectories
├─ src/
│  ├─ main.tsx, App.tsx       # app + routes (HashRouter)
│  ├─ data/games.ts, apps.ts  # the catalogs (edit these to add entries)
│  ├─ lib/                    # prefs, cloak, storage, thumbnails
│  ├─ components/             # Sidebar, TopBar, cards, player, cloak overlay…
│  └─ pages/                  # Home, Games, Apps, Browser, Favorites, Settings, Play
├─ public/
│  ├─ games/                  # the 22 bundled games + shared shell.js/.css
│  └─ .nojekyll, favicon.svg
├─ backend/                   # the proxy backend (host separately)
└─ .github/workflows/deploy.yml
```

---

## Accessibility & performance

- Respects `prefers-reduced-motion` (and a manual "Reduce motion" toggle).
- Keyboard-navigable controls, visible focus rings, and readable contrast on the
  dark theme.
- Games load only when opened (the player mounts the iframe on demand); cards use
  generated thumbnails, so the grid stays light. Animations are kept restrained
  so they don't interfere with gameplay.

---

## What was and wasn't verified

Verified in this environment:

- Production build (`npm run build`) and type-checking pass.
- All 22 bundled games load and run without console errors (headless smoke
  test), including keyboard/mouse input and restart.
- The backend's `/healthz`, token auth (401 without a token), SSRF guards
  (`127.0.0.1`, `169.254.169.254`, `file:` all rejected), and the full
  fetch → header-strip → link/CSS rewrite → binary passthrough path (tested
  against a local origin server).

Not verified here (environment limits), but implemented:

- Proxying a real public website end-to-end — this build environment has no
  direct outbound DNS/egress (it is proxy-only), so a live fetch to, say,
  `example.com` could not be exercised. The rewriting path itself is verified
  above against a local server.
- WebSockets are intentionally **not** supported by this proxy.
- GitHub Pages deployment runs via the included Actions workflow once the repo's
  Pages source is set to "GitHub Actions"; it was not executed from here.
