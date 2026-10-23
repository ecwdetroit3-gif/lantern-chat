# Lantern

A static website with browser games, a web proxy and an AI chat page. Everything runs in the browser, so it can be hosted for free on GitHub Pages.

| Page | What it is |
| --- | --- |
| `index.html` | Home page: game library and a search box that opens in the proxy |
| `games/` | Snake, 2048, Blocks, Minesweeper, Breakout, Flap, Pong and Connect Four |
| `proxy.html` | Web proxy built on [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet) |
| `chat.html` | Lantern Chat (bring your own API key) |

Scores, settings and chats are saved in the visitor's browser (`localStorage`). Nothing is sent to a server except proxied traffic and chat requests to the AI provider you choose.

## Publish on GitHub Pages

1. Merge this branch into `main`.
2. On GitHub, open the repository's **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, pick `main` and `/ (root)`, then **Save**.
4. After a minute the site is live at `https://<your-username>.github.io/lantern-chat/`.

GitHub Pages is free for public repositories. Private repositories need a paid plan.

## How the proxy works

GitHub Pages can only serve files, so the proxy runs in the visitor's browser:

- `uv/sw.js` is a service worker that rewrites every page, script and request under `uv/service/` (Ultraviolet).
- `baremux/` passes those requests to a transport, and `epoxy/` sends them over an encrypted connection to a **Wisp server**.
- The Wisp server is the only part that runs somewhere else. It opens the real connections to websites.

The default Wisp server is the public one run by Mercury Workshop (`wss://wisp.mercurywork.shop/`). Public servers can go down or be blocked, so the proxy checks the server when it starts and shows an error if it can't connect. You can change the server in the proxy's settings (gear icon).

To run your own Wisp server, use [wisp-js](https://github.com/MercuryWorkshop/wisp-js) or [wisp-server-python](https://github.com/MercuryWorkshop/wisp-server-python) on any host that supports WebSockets, then enter its `wss://` address in the proxy settings.

**Safety:** proxied sites run on this website's address. Ultraviolet keeps their storage apart from the rest of the site, but that isn't a hard security boundary. Don't sign in to important accounts through the proxy, and don't browse untrusted sites with it while an API key is saved in Chat.

The proxy needs a browser with service workers and shared workers (current Chrome, Edge or Firefox on a computer). Some private-browsing modes turn service workers off.

## Run it locally

Service workers only run on `https://` or `localhost`, so open the site through a local server rather than as a file:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000/
```

## Third-party code

The proxy files are copied unchanged from npm:

| Folder | Package | License |
| --- | --- | --- |
| `uv/` (except `sw.js` and `uv.config.js`) | `@titaniumnetwork-dev/ultraviolet` 3.2.10 | AGPL-3.0, see `uv/LICENSE` (the package's `package.json` says MIT, but the license file it ships is AGPL-3.0) |
| `baremux/` | `@mercuryworkshop/bare-mux` 2.1.9 | MIT, see `baremux/LICENSE` |
| `epoxy/` | `@mercuryworkshop/epoxy-transport` 2.1.28 | AGPL-3.0, see `epoxy/LICENSE` |

Source for each is in its npm package. The games and pages are original code in this repository.
