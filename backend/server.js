// ORBIT web proxy backend.
//
// An authenticated, rate-limited, SSRF-guarded HTTP(S) rewriting proxy that the
// ORBIT "Browser" page talks to. It fetches a target page server-side, strips
// framing protections, and rewrites links/assets so they load back through this
// same proxy. It is deliberately simple and transparent.
//
// Honest scope: this handles ordinary GET navigation and static assets
// (HTML/CSS/images/fonts/scripts served as files). It does NOT implement
// WebSockets, and many login-gated or heavily script-driven single-page apps
// will not work, because URLs those apps build at runtime in JavaScript are not
// rewritten. For full-fidelity proxying, point ORBIT at an Ultraviolet + Wisp
// deployment instead (see backend/README.md).

import express from 'express';
import rateLimit from 'express-rate-limit';
import ipaddr from 'ipaddr.js';
import dns from 'node:dns/promises';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Minimal .env loader (no dependency) ──────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
(function loadEnv() {
  const f = path.join(__dirname, '.env');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
})();

const PORT = parseInt(process.env.PORT || '8080', 10);
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim()).filter(Boolean);
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '15000', 10);
const MAX_CONTENT_BYTES = parseInt(process.env.MAX_CONTENT_BYTES || '8000000', 10);
const MAX_REDIRECTS = parseInt(process.env.MAX_REDIRECTS || '5', 10);
const BLOCK_PRIVATE = (process.env.BLOCK_PRIVATE_IPS || 'true') !== 'false';
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');

const app = express();
app.set('trust proxy', true);
app.disable('x-powered-by');

// ── CORS (only needed for browser fetches to /healthz) ───────────────────────
function applyCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes('*')) res.setHeader('Access-Control-Allow-Origin', '*');
  else if (origin && ALLOWED_ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}
app.use((req, res, next) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Rate limiting (per IP) ───────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '120', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many requests, slow down.' },
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/healthz', (_req, res) => {
  res.json({ ok: true, service: 'orbit-proxy', authRequired: Boolean(ACCESS_TOKEN), time: Date.now() });
});

// ── SSRF guard ───────────────────────────────────────────────────────────────
function ipIsPublic(addr) {
  let ip;
  try { ip = ipaddr.parse(addr); } catch { return false; }
  if (ip.kind() === 'ipv6' && ip.isIPv4MappedAddress()) ip = ip.toIPv4Address();
  const range = ip.range();
  // Only ordinary public unicast is allowed.
  return range === 'unicast';
}

async function assertSafeUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw httpError(400, 'bad_url', 'That is not a valid URL.'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw httpError(400, 'bad_scheme', 'Only http and https are supported.');
  if (!BLOCK_PRIVATE) return u;
  // Literal IP host?
  const host = u.hostname;
  if (ipaddr.isValid(host)) {
    if (!ipIsPublic(host)) throw httpError(403, 'blocked', 'That address is not allowed.');
    return u;
  }
  if (/^(localhost|.*\.local|.*\.internal|.*\.lan)$/i.test(host)) throw httpError(403, 'blocked', 'That host is not allowed.');
  let addrs;
  try { addrs = await dns.lookup(host, { all: true }); } catch { throw httpError(502, 'dns', 'Could not resolve that host.'); }
  if (!addrs.length || !addrs.every((a) => ipIsPublic(a.address))) throw httpError(403, 'blocked', 'That host resolves to a disallowed address.');
  return u;
}

function httpError(status, code, message) {
  const e = new Error(message);
  e.status = status; e.code = code; return e;
}

// ── Guarded fetch with manual, re-validated redirects and a size cap ─────────
async function guardedFetch(startUrl) {
  let current = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertSafeUrl(current);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    let resp;
    try {
      resp = await fetch(current, {
        redirect: 'manual',
        signal: ctrl.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ORBIT-Proxy/1.0)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
    } finally {
      clearTimeout(timer);
    }
    // Redirect?
    if (resp.status >= 300 && resp.status < 400 && resp.headers.get('location')) {
      current = new URL(resp.headers.get('location'), current).href;
      continue;
    }
    return { resp, finalUrl: current };
  }
  throw httpError(508, 'too_many_redirects', 'Too many redirects.');
}

async function readCapped(resp) {
  const len = parseInt(resp.headers.get('content-length') || '0', 10);
  if (len && len > MAX_CONTENT_BYTES) throw httpError(413, 'too_large', 'That response is too large to proxy.');
  const reader = resp.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_CONTENT_BYTES) { try { await reader.cancel(); } catch {} throw httpError(413, 'too_large', 'That response is too large to proxy.'); }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

// ── URL rewriting ────────────────────────────────────────────────────────────
function makeWrapper(selfBase, token) {
  const q = token ? `&token=${encodeURIComponent(token)}` : '';
  return (abs) => `${selfBase}/proxy?url=${encodeURIComponent(abs)}${q}`;
}
const SKIP = /^(data:|javascript:|mailto:|tel:|blob:|about:|#|vbscript:)/i;

function resolveMaybe(ref, base) {
  if (!ref || SKIP.test(ref.trim())) return null;
  try {
    const abs = new URL(ref, base);
    if (abs.protocol !== 'http:' && abs.protocol !== 'https:') return null;
    return abs.href;
  } catch { return null; }
}

function rewriteCss(css, base, wrap) {
  css = css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (m, q, ref) => {
    const abs = resolveMaybe(ref, base);
    return abs ? `url(${q}${wrap(abs)}${q})` : m;
  });
  css = css.replace(/@import\s+(['"])([^'"]+)\1/gi, (m, q, ref) => {
    const abs = resolveMaybe(ref, base);
    return abs ? `@import ${q}${wrap(abs)}${q}` : m;
  });
  return css;
}

function rewriteSrcset(value, base, wrap) {
  return value
    .split(',')
    .map((part) => {
      const seg = part.trim();
      if (!seg) return seg;
      const sp = seg.split(/\s+/);
      const abs = resolveMaybe(sp[0], base);
      if (abs) sp[0] = wrap(abs);
      return sp.join(' ');
    })
    .join(', ');
}

function rewriteHtml(html, base, wrap) {
  // Drop <base> so our absolute rewrites win, and strip framing/CSP meta.
  html = html.replace(/<base\b[^>]*>/gi, '');
  html = html.replace(/<meta[^>]+http-equiv\s*=\s*["']?content-security-policy["']?[^>]*>/gi, '');

  // href / src / action / poster / data-src (quoted values).
  html = html.replace(/\b(href|src|action|poster|data-src|data-href|formaction)\s*=\s*(["'])([^"']*)\2/gi, (m, attr, q, val) => {
    const abs = resolveMaybe(val, base);
    return abs ? `${attr}=${q}${wrap(abs)}${q}` : m;
  });

  // srcset.
  html = html.replace(/\bsrcset\s*=\s*(["'])([^"']*)\1/gi, (m, q, val) => `srcset=${q}${rewriteSrcset(val, base, wrap)}${q}`);

  // inline style="" attributes.
  html = html.replace(/\bstyle\s*=\s*(["'])([^"']*)\1/gi, (m, q, val) => `style=${q}${rewriteCss(val, base, wrap)}${q}`);

  // <style> blocks.
  html = html.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, open, css, close) => open + rewriteCss(css, base, wrap) + close);

  // A small banner + <base target=_self> so relative anchors stay in-frame.
  const inject = `<base target="_self">`;
  if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (h) => h + inject);
  else html = inject + html;

  return html;
}

// ── Proxy endpoint ───────────────────────────────────────────────────────────
app.get('/proxy', limiter, async (req, res) => {
  // Auth.
  if (ACCESS_TOKEN) {
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const token = req.query.token || bearer;
    if (token !== ACCESS_TOKEN) return res.status(401).json({ error: 'unauthorized', message: 'Missing or invalid access token.' });
  }

  const target = req.query.url;
  if (!target || typeof target !== 'string') return res.status(400).json({ error: 'missing_url', message: 'Provide ?url=' });

  const selfBase = PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  const wrap = makeWrapper(selfBase, token);

  try {
    await assertSafeUrl(target);
    const { resp, finalUrl } = await guardedFetch(target);
    const type = (resp.headers.get('content-type') || 'application/octet-stream').toLowerCase();

    // Base response headers (framing protections removed on purpose).
    res.status(resp.status);
    res.setHeader('Cache-Control', 'no-store');
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');

    if (type.includes('text/html')) {
      const buf = await readCapped(resp);
      const html = rewriteHtml(buf.toString('utf8'), finalUrl, wrap);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }
    if (type.includes('text/css')) {
      const buf = await readCapped(resp);
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
      return res.send(rewriteCss(buf.toString('utf8'), finalUrl, wrap));
    }
    // Everything else: pass bytes through with the original content-type.
    const buf = await readCapped(resp);
    res.setHeader('Content-Type', type);
    return res.send(buf);
  } catch (err) {
    const status = err.status || 502;
    return res.status(status).json({ error: err.code || 'proxy_error', message: err.message || 'Proxy failed.' });
  }
});

app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

app.listen(PORT, () => {
  console.log(`[orbit-proxy] listening on :${PORT}`);
  if (!ACCESS_TOKEN) console.warn('[orbit-proxy] WARNING: ACCESS_TOKEN is empty — the proxy is OPEN. Set it before exposing this server.');
  console.log(`[orbit-proxy] allowed origins: ${ALLOWED_ORIGINS.join(', ')} | block private IPs: ${BLOCK_PRIVATE}`);
});
