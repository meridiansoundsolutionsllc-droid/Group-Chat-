import { getStore, getDeployStore } from "@netlify/blobs";

export type ChatMessage = {
  id: string;
  room: string;
  user: string;
  role: "user" | "ai";
  text: string;
  createdAt: string;
};

export function cleanRoom(value: unknown): string {
  const room = String(value ?? "");
  if (!/^[A-Za-z0-9_-]{12,64}$/.test(room)) {
    throw new Error("Invalid room.");
  }
  return room;
}

export function cleanUser(value: unknown): string {
  const user = String(value ?? "").trim().slice(0, 40);
  if (!user || !/^[A-Za-z0-9 ._'-]+$/.test(user)) {
    throw new Error("Invalid user.");
  }
  return user;
}

export function cleanText(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) throw new Error("Message is empty.");
  if (text.length > 4000) throw new Error("Message is too long.");
  return text;
}

export function chatStore() {
  const deployContext = Netlify.context?.deploy?.context;
  if (deployContext === "production") {
    return getStore("shared-chat", { consistency: "strong" });
  }
  return getDeployStore("shared-chat");
}

export async function readMessages(room: string, limit = 200): Promise<ChatMessage[]> {
  const store = chatStore();
  const prefix = `${room}/messages/`;
  const { blobs } = await store.list({ prefix });
  const selected = blobs
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-limit);

  const values = await Promise.all(
    selected.map(item => store.get(item.key, { type: "json" }))
  );

  return values
    .filter(Boolean)
    .sort((a: ChatMessage, b: ChatMessage) => a.createdAt.localeCompare(b.createdAt));
}

export async function saveMessage(message: ChatMessage): Promise<void> {
  const store = chatStore();
  const stamp = String(new Date(message.createdAt).getTime()).padStart(13, "0");
  await store.setJSON(`${message.room}/messages/${stamp}-${message.id}`, message);
}
