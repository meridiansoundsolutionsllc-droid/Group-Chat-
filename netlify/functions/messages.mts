import type { Config, Context } from "@netlify/functions";
import { randomUUID } from "node:crypto";
import { cleanRoom, cleanText, cleanUser, readMessages, saveMessage } from "./_shared/store.mts";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export default async (req: Request, context: Context) => {
  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const room = cleanRoom(url.searchParams.get("room"));
      const messages = await readMessages(room, 200);
      return json({ messages });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const room = cleanRoom(body.room);
      const user = cleanUser(body.user);
      const text = cleanText(body.text);
      const createdAt = new Date().toISOString();

      const message = {
        id: randomUUID(),
        room,
        user,
        role: "user" as const,
        text,
        createdAt,
      };

      await saveMessage(message);
      return json({ message }, 201);
    }

    return json({ error: "Method not allowed." }, 405);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Request failed." }, 400);
  }
};

export const config: Config = {
  path: "/api/messages",
};
