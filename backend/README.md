# ORBIT proxy backend

A small, authenticated web proxy for the ORBIT **Browser** page. GitHub Pages
can only host the static ORBIT frontend, so the proxy runs here as a separate
service that you host yourself.

## What it does

- `GET /healthz` — public health check. The frontend polls this to show the
  connection status. Returns `{ ok: true, ... }`.
- `GET /proxy?url=<target>&token=<token>` — fetches `<target>` server-side,
  removes framing protections (`X-Frame-Options`, `Content-Security-Policy`),
  and rewrites links and assets so they load back through `/proxy`.

## Safeguards built in

- **Access token** — every `/proxy` request must present `ACCESS_TOKEN`
  (via `?token=` or `Authorization: Bearer`). Treat it as a shared password.
- **SSRF protection** — target hosts are resolved and rejected if they point at
  private, loopback, link-local or reserved ranges (e.g. `127.0.0.1`,
  `10.0.0.0/8`, `169.254.169.254` cloud metadata). Redirects are followed
  manually and re-checked on every hop.
- **Rate limiting** — per-IP, configurable (`RATE_LIMIT_MAX` per
  `RATE_LIMIT_WINDOW_MS`).
- **Size & time caps** — `MAX_CONTENT_BYTES` and `REQUEST_TIMEOUT_MS`.
- **No cookie relay** — upstream `Set-Cookie` headers are dropped, keeping the
  proxy stateless and isolating sessions.

## Honest limitations

This is a classic request/rewrite proxy. It handles ordinary page navigation
and static assets well. It does **not**:

- support **WebSockets**;
- rewrite URLs that a site builds at runtime in JavaScript, so many
  **single-page apps** and **logged-in** experiences will not work;
- handle form **POST** submissions (GET navigation only).

If you need full fidelity (SPAs, WebSockets, logins), deploy an
[Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet) + Wisp stack
and set ORBIT's backend URL to it. ORBIT only needs a backend that answers
`/healthz` and serves proxied pages; the rewriting proxy here is the
batteries-included default.

## Run it locally

```bash
cd backend
cp .env.example .env
# edit .env: set ACCESS_TOKEN to a long random value
npm install
npm start
# -> [orbit-proxy] listening on :8080
```

Then in ORBIT → **Settings → Browser backend**:

- Backend URL: `http://localhost:8080`
- Access token: the `ACCESS_TOKEN` you set

Click **Test connection** — it should say "Reached backend".

## Deploy

The server is a single `server.js` with three dependencies and reads config from
environment variables, so it runs on anything that runs Node 18+.

### Docker

```bash
cd backend
docker build -t orbit-proxy .
docker run -p 8080:8080 \
  -e ACCESS_TOKEN="$(openssl rand -hex 32)" \
  -e ALLOWED_ORIGINS="https://YOURNAME.github.io" \
  orbit-proxy
```

### Render / Railway / Fly.io / a VPS

- **Build:** `npm install`
- **Start:** `npm start`
- Set env vars from `.env.example` (at minimum `ACCESS_TOKEN`, and
  `ALLOWED_ORIGINS` = your Pages origin).
- Put it behind HTTPS (these platforms do this for you). ORBIT pages are served
  over HTTPS, so the backend must be HTTPS too or the browser will block it as
  mixed content.

Point ORBIT's **Backend URL** at the public HTTPS URL the platform gives you.

## Security notes

- The access token is sent as a query parameter so it can ride along with
  `<iframe>` navigation. That means it can appear in server/proxy logs — rotate
  it if leaked, and prefer deploying the backend privately (e.g. restrict
  `ALLOWED_ORIGINS`, or front it with your own auth/VPN) rather than relying on
  the token alone.
- Keep `BLOCK_PRIVATE_IPS=true` whenever the backend can reach anything you
  don't want proxied (internal services, cloud metadata).
- No real secrets live in the frontend — only the backend URL and this shared
  token, both entered by the user in Settings and stored in their own browser.
