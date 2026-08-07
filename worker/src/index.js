const STYLES = ["plain", "pink", "terminal", "sunset"];
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
      const { results } = await env.guestbook
        .prepare(
          "SELECT id, name, message, style, created_at FROM entries ORDER BY id DESC LIMIT 100"
        )
        .all();
      return Response.json({ entries: results }, { headers });
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
      if (!message || message.length > 500) {
        return Response.json({ error: "message must be 1–500 characters" }, { status: 400, headers });
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
