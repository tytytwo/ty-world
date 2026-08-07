const STYLES = [
  "plain",
  "pink",
  "terminal",
  "sunset",
  "ocean",
  "lavender",
  "paper",
  "neon",
  "matcha",
  "sticky",
  "postcard",
  "win95",
  "newsprint",
  "blueprint",
];
const ORIGINS = ["https://ty-world.me", "http://localhost:1313"];

function cors(request) {
  const origin = request.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request, env) {
    const headers = cors(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (request.method === "GET") {
      const PER_PAGE = 12;
      const page = Math.max(1, parseInt(new URL(request.url).searchParams.get("page"), 10) || 1);

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
        { entries: results, total, page, perPage: PER_PAGE },
        { headers }
      );
    }

    if (request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "bad json" }, { status: 400, headers });
      }

      // Honeypot: hidden form field only bots fill in. Pretend success, save nothing.
      if (body.website) {
        return Response.json({ ok: true }, { headers });
      }

      const name = String(body.name ?? "").trim();
      const message = String(body.message ?? "").trim();
      const style = STYLES.includes(body.style) ? body.style : STYLES[0];

      if (!name || name.length > 40) {
        return Response.json({ error: "name must be 1–40 characters" }, { status: 400, headers });
      }
      if (!message || message.length > 160) {
        return Response.json({ error: "message must be 1–160 characters" }, { status: 400, headers });
      }
      if (message.split("\n").length > 5) {
        return Response.json({ error: "max 5 lines" }, { status: 400, headers });
      }

      await env.guestbook
        .prepare("INSERT INTO entries (name, message, style) VALUES (?1, ?2, ?3)")
        .bind(name, message, style)
        .run();

      return Response.json({ ok: true }, { headers });
    }

    return new Response("method not allowed", { status: 405, headers });
  },
};
