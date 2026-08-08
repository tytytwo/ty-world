const STYLES = [
  "plain",
  "pink",
  "terminal",
  "ocean",
  "lavender",
  "paper",
  "matcha",
  "sticky",
  "postcard",
  "win95",
  "newsprint",
  "blueprint",
  "gameboy",
  "polaroid",
  "receipt",
  "chalkboard",
  "mixtape",
];

const ORIGINS = ["https://ty-world.me", "http://localhost:1313"];

const PER_PAGE = 12;
const MAX_BODY_BYTES = 4096;

// Per-IP: at most 3 entries per 10 minutes, 15 per day.
const BURST_WINDOW_MS = 10 * 60 * 1000;
const BURST_MAX = 3;
const DAY_WINDOW_MS = 24 * 60 * 60 * 1000;
const DAY_MAX = 15;

// Everyone combined: caps a distributed flood before it eats the D1 write quota.
const GLOBAL_WINDOW_MS = 5 * 60 * 1000;
const GLOBAL_MAX = 30;

// A form token younger than this means nobody typed the message; older means stale.
const MIN_DWELL_MS = 3000;
const TOKEN_TTL_MS = 60 * 60 * 1000;

const LINKS =
  /(https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|io|ru|cn|xyz|top|info|biz|shop|link|click|store|online|site|live)\b)/i;
const REPEATED_CHAR = /(.)\1{19,}/;
// Control characters, zero-width joiners and bidi overrides: invisible in a card,
// used to smuggle text past filters or scramble the page.
const INVISIBLE = /[\u0000-\u0008\u000B-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

function cors(request) {
  const origin = request.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
  };
}

function isoAgo(ms) {
  return new Date(Date.now() - ms).toISOString().slice(0, 19) + "Z";
}

async function hmac(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Stable pseudonym for a visitor: never stores the raw IP, and can't be reversed
// without the secret. Enough to rate limit, not enough to identify anyone.
async function clientId(request, secret) {
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  return (await hmac(secret, "ip:" + ip)).slice(0, 32);
}

async function issueToken(secret, who) {
  const iat = Date.now();
  return iat + "." + (await hmac(secret, iat + ":" + who)).slice(0, 32);
}

async function tokenError(secret, who, token) {
  if (typeof token !== "string" || !token.includes(".")) return "reload the page and try again";
  const [iatRaw, sig] = token.split(".");
  const iat = Number(iatRaw);
  if (!Number.isFinite(iat)) return "reload the page and try again";

  const expected = (await hmac(secret, iat + ":" + who)).slice(0, 32);
  if (!safeEqual(sig, expected)) return "reload the page and try again";

  const age = Date.now() - iat;
  if (age < MIN_DWELL_MS) return "slow down a second";
  if (age > TOKEN_TTL_MS) return "this form went stale — reload the page";
  return null;
}

function clean(value) {
  return String(value ?? "").replace(INVISIBLE, "").trim();
}

function reject(message, status, headers, extra) {
  return Response.json({ error: message }, { status, headers: { ...headers, ...extra } });
}

export default {
  async fetch(request, env) {
    const headers = cors(request);
    const secret = env.GB_SECRET;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (!secret) {
      return reject("guestbook is not configured", 503, headers);
    }

    const who = await clientId(request, secret);

    if (request.method === "GET") {
      const page = Math.min(
        10000,
        Math.max(1, parseInt(new URL(request.url).searchParams.get("page"), 10) || 1)
      );

      const { total } = await env.guestbook
        .prepare("SELECT COUNT(*) AS total FROM entries")
        .first();

      const { results } = await env.guestbook
        .prepare(
          "SELECT id, name, message, style, created_at FROM entries ORDER BY id DESC LIMIT ?1 OFFSET ?2"
        )
        .bind(PER_PAGE, (page - 1) * PER_PAGE)
        .all();

      return Response.json(
        {
          entries: results,
          total,
          page,
          perPage: PER_PAGE,
          token: await issueToken(secret, who),
        },
        { headers }
      );
    }

    if (request.method !== "POST") {
      return reject("method not allowed", 405, headers);
    }

    if (!ORIGINS.includes(request.headers.get("Origin"))) {
      return reject("posting is only allowed from the guestbook page", 403, headers);
    }

    if (!(request.headers.get("Content-Type") || "").includes("application/json")) {
      return reject("expected json", 415, headers);
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return reject("that's too much text", 413, headers);
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return reject("bad json", 400, headers);
    }

    // Honeypot: a field hidden from humans. Pretend success, save nothing.
    if (body.website) {
      return Response.json({ ok: true }, { headers });
    }

    const tokenProblem = await tokenError(secret, who, body.token);
    if (tokenProblem) {
      return reject(tokenProblem, 403, headers);
    }

    const name = clean(body.name);
    const message = clean(body.message);
    const style = STYLES.includes(body.style) ? body.style : STYLES[0];

    if (!name || name.length > 40) {
      return reject("name must be 1–40 characters", 400, headers);
    }
    if (!message || message.length > 160) {
      return reject("message must be 1–160 characters", 400, headers);
    }
    if (message.split("\n").length > 5) {
      return reject("max 5 lines", 400, headers);
    }
    if (LINKS.test(message) || LINKS.test(name)) {
      return reject("links aren't allowed here", 400, headers);
    }
    if (REPEATED_CHAR.test(message) || REPEATED_CHAR.test(name)) {
      return reject("easy on the keyboard mashing", 400, headers);
    }

    // One pass over the last 24h answers every abuse question at once.
    const counts = await env.guestbook
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN ip_hash = ?1 AND created_at > ?2 THEN 1 END), 0) AS burst,
           COALESCE(SUM(CASE WHEN ip_hash = ?1 THEN 1 END), 0) AS daily,
           COALESCE(SUM(CASE WHEN created_at > ?3 THEN 1 END), 0) AS flood,
           COALESCE(SUM(CASE WHEN ip_hash = ?1 AND message = ?4 THEN 1 END), 0) AS dupes
         FROM entries
         WHERE created_at > ?5`
      )
      .bind(who, isoAgo(BURST_WINDOW_MS), isoAgo(GLOBAL_WINDOW_MS), message, isoAgo(DAY_WINDOW_MS))
      .first();

    if (counts.dupes > 0) {
      return reject("you already said that", 429, headers, { "Retry-After": "3600" });
    }
    if (counts.burst >= BURST_MAX) {
      return reject("you've signed a few times just now — come back later", 429, headers, {
        "Retry-After": "600",
      });
    }
    if (counts.daily >= DAY_MAX) {
      return reject("that's plenty for one day", 429, headers, { "Retry-After": "3600" });
    }
    if (counts.flood >= GLOBAL_MAX) {
      return reject("the guestbook is busy right now — try again shortly", 429, headers, {
        "Retry-After": "300",
      });
    }

    await env.guestbook
      .prepare("INSERT INTO entries (name, message, style, ip_hash) VALUES (?1, ?2, ?3, ?4)")
      .bind(name, message, style, who)
      .run();

    return Response.json({ ok: true }, { headers });
  },
};
