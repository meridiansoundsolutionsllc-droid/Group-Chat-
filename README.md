# CNN — Christopher + Nikki + AI live chat

This repository is ready for a Netlify deployment.

## What it does

- One shared invite-room URL for Christopher and Nikki
- Near-real-time message sync (1-second polling)
- Typing indicators
- Persistent production chat history via Netlify Blobs
- `@AI` invokes an AI participant
- The OpenAI API key stays on the server in Netlify environment variables

## Deploy

If this GitHub repository is already connected to the Netlify project, commit/push these files to the repository root. Netlify should install dependencies and deploy automatically.

Netlify settings are included in `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `public`
- Functions directory: `netlify/functions`

## Configure the AI participant

In Netlify, add this environment variable to the project:

`OPENAI_API_KEY` = your OpenAI API key

Optional:

`OPENAI_MODEL` = `gpt-5.6-luna`

If `OPENAI_MODEL` is omitted, the function defaults to `gpt-5.6-luna`.

Do not put the API key in `public/index.html`, GitHub, or any client-side JavaScript.

## Invite Nikki

1. Open the deployed site.
2. The first visit generates an unguessable `?room=...` value in the URL.
3. Choose **Christopher**.
4. Copy the entire URL, including `?room=...`.
5. Send that exact URL to Nikki.
6. Nikki opens it and chooses **Nikki**.

Everyone with the exact room URL can read and post in that room. This first version intentionally uses an invite-link model rather than account authentication.

## AI usage

Send a message containing `@AI`, for example:

`@AI give us three dinner ideas near Midtown`

Your user message is stored first, then the server sends recent room context to the OpenAI Responses API and stores the AI reply in the shared room.

## Notes

This version uses short polling rather than WebSockets, so it behaves near-real-time while remaining simple to deploy on Netlify.
