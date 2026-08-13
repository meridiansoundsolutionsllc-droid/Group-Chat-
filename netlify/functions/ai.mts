import type { Config, Context } from "@netlify/functions";
import { randomUUID } from "node:crypto";
import { cleanRoom, cleanText, cleanUser, readMessages, saveMessage } from "./_shared/store.mts";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function extractText(payload: any): string {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts: string[] = [];
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }
  return parts.join("\n").trim();
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const body = await req.json();
    const room = cleanRoom(body.room);
    const user = cleanUser(body.user);
    const text = cleanText(body.text);

    const apiKey = Netlify.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return json({
        error: "AI is not configured yet. Add OPENAI_API_KEY in the Netlify project's environment variables."
      }, 503);
    }

    const recent = await readMessages(room, 30);
    const transcript = recent
      .map(m => `${m.role === "ai" ? "AI" : m.user}: ${m.text}`)
      .join("\n");

    const model = Netlify.env.get("OPENAI_MODEL") || "gpt-5.6-luna";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions:
          "You are the AI participant in a private group chat between Christopher and Nikki. " +
          "Participate only because someone explicitly invoked @AI. Address the actual request naturally, " +
          "use the preceding transcript for context, do not pretend to be either person, and keep ordinary chat replies concise unless more detail is clearly useful.",
        input:
          `Recent group chat:\n${transcript}\n\n` +
          `${user} has just invoked you with this message:\n${text}\n\nRespond to the group.`,
        max_output_tokens: 700,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      const detail = payload?.error?.message || "OpenAI request failed.";
      return json({ error: detail }, response.status);
    }

    const answer = extractText(payload);
    if (!answer) {
      return json({ error: "The AI returned an empty response." }, 502);
    }

    const message = {
      id: randomUUID(),
      room,
      user: "AI",
      role: "ai" as const,
      text: answer,
      createdAt: new Date().toISOString(),
    };

    await saveMessage(message);
    return json({ message }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "AI request failed." }, 400);
  }
};

export const config: Config = {
  path: "/api/ai",
};
