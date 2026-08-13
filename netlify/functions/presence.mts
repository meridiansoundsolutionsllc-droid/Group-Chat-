import type { Config, Context } from "@netlify/functions";
import { cleanRoom, cleanUser, chatStore } from "./_shared/store.mts";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export default async (req: Request, context: Context) => {
  try {
    const store = chatStore();

    if (req.method === "GET") {
      const url = new URL(req.url);
      const room = cleanRoom(url.searchParams.get("room"));
      const prefix = `${room}/presence/`;
      const { blobs } = await store.list({ prefix });
      const rows = await Promise.all(blobs.map(b => store.get(b.key, { type: "json" })));
      const now = Date.now();

      const people = rows
        .filter(Boolean)
        .filter((p: any) => now - new Date(p.lastSeen).getTime() < 12000)
        .map((p: any) => ({
          user: p.user,
          typing: Boolean(p.typing) && now - new Date(p.lastSeen).getTime() < 7000,
          lastSeen: p.lastSeen,
        }));

      return json({ people });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const room = cleanRoom(body.room);
      const user = cleanUser(body.user);
      const state = {
        user,
        typing: Boolean(body.typing),
        lastSeen: new Date().toISOString(),
      };
      await store.setJSON(`${room}/presence/${encodeURIComponent(user)}`, state);
      return json({ ok: true });
    }

    return json({ error: "Method not allowed." }, 405);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Request failed." }, 400);
  }
};

export const config: Config = {
  path: "/api/presence",
};
