# asAi Chat — deployment

Branded chat client for asAi customers, served at **https://chat.serverasai.com**.

The customer pastes their own asAi API key; every request is billed to their asAi credit. The app
holds no server-side asAi credential.

## What this deployment is

- A fork of the Oriveo web client, gated to a single locked provider (asAi) — see
  [`packages/config/src/product-surface.ts`](../../../packages/config/src/product-surface.ts).
- asAi speaks the OpenAI Chat Completions protocol with `Authorization: Bearer <key>`, which is
  exactly Oriveo's `relay` transport `openai_chat_completions`. The app therefore runs as a
  pre-seeded, locked relay provider: base URL `https://serveras.click/v1`, transport and auth
  fixed, not editable by the user.
- Session state (provider config, conversations) lives in the browser. The only server component
  is the Next.js route handler; there is no app-account database.

## Build

```sh
# From the repo root (the directory containing web/):
docker build \
  -f web/apps/app/Dockerfile \
  --build-arg NEXT_PUBLIC_APP_URL=https://chat.serverasai.com \
  --build-arg NEXT_PUBLIC_ASAI_API_BASE_URL=https://serveras.click/v1 \
  --build-arg NEXT_PUBLIC_SOURCE_URL=https://github.com/hadeskali-up/asai-chat \
  -t asai-chat:$(git rev-parse --short HEAD) .
```

`NEXT_PUBLIC_*` values are inlined into the client bundle at build time. Rebuild to change them.

## Run

```sh
ASAI_CHAT_IMAGE=asai-chat:<tag> ASAI_CHAT_PORT=3002 \
  docker compose -f web/apps/app/compose.yaml up -d
```

The service binds `127.0.0.1:3002` on the host. Nothing is published on a public interface.

## Reverse proxy

Add [`deploy/Caddyfile.chat.serverasai.com`](./Caddyfile.chat.serverasai.com) to the host Caddy
config (the same one that fronts `serveras.click` / `serverasai.com`). Point
`chat.serverasai.com`'s DNS at the host first; Caddy issues the certificate automatically.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | build | Origin used for canonical URLs, sitemap, OG metadata. |
| `NEXT_PUBLIC_ASAI_API_BASE_URL` | build | asAi API root the app talks to. Default `https://serveras.click/v1`. |
| `NEXT_PUBLIC_SOURCE_URL` | build | Public source repo — **AGPL-3.0 §13 requirement**, see below. |
| `ASAI_CHAT_PORT` | run | Loopback port the proxy forwards to (default `3002`). |
| `NEXT_PUBLIC_LIBRARY_ENABLED` | build | Leave unset. Library needs a connector this build does not ship. |
| `NEXT_PUBLIC_BACKEND_URL` | build | Leave unset. Oriveo's catalog service is not used; models come from asAi. |

## Licensing — read before publishing DNS

This is an AGPL-3.0 fork offered to users over a network. **Section 13 requires that the complete
corresponding source of the running revision is reachable by those users.** Before the hostname
resolves publicly:

1. Push this tree (with all asAi changes) to `https://github.com/hadeskali-up/asai-chat`.
2. Make sure the About page's "Source code" link points at the **same revision** that is deployed.
3. Keep `NEXT_PUBLIC_SOURCE_URL` in sync with that repository.

## Known limitations (Release 1)

- **Model prices.** asAi's `/v1/models` returns per-model `rates`, but the app decorates prices
  from Oriveo's own catalog service (not deployed here), so price tiers show as unknown. Core chat
  is unaffected. Mapping asAi `rates` into the model list is a follow-up.
- **Images.** Image generation is off; the asAi chat app is text/vision chat only.
- **Cosmetic naming.** The About page uses `brand.name` ("asAi Chat"); the logo component still
  carries the upstream `OriveoLogo` name. Purely internal; no user-visible "Oriveo" text remains
  in the primary chrome.
