# asAi Chat — production image.
#
# Multi-stage build of the Next.js app workspace, run with `next start` exactly as the repo's
# own `start` script does. No standalone output mode: that path is not part of the app's tested
# scripts, and the deployment only needs one long-lived Node process behind the host proxy.
#
# Build (from the repo root — the directory that contains web/):
#   docker build -f web/apps/app/Dockerfile -t asai-chat .
#
# The container serves on 127.0.0.1:3001; the host reverse proxy terminates TLS for
# chat.serverasai.com and forwards to it.

# ---- deps: install workspace dependencies against the lockfile --------------------------------
FROM node:22-bookworm-slim AS deps
WORKDIR /repo
# Manifests first, so a source edit does not invalidate the dependency layer.
COPY web/package.json web/package-lock.json ./
COPY web/apps/app/package.json apps/app/package.json
COPY web/packages/config/package.json packages/config/package.json
COPY web/packages/core/package.json packages/core/package.json
COPY web/packages/shared/package.json packages/shared/package.json
COPY web/packages/ui/package.json packages/ui/package.json
RUN npm ci

# ---- build: compile the app --------------------------------------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY web/ ./
# NEXT_PUBLIC_* values are inlined at build time; pass the real origin here.
ARG NEXT_PUBLIC_APP_URL=https://chat.serverasai.com
ARG NEXT_PUBLIC_ASAI_API_BASE_URL=https://serveras.click/v1
ARG NEXT_PUBLIC_SOURCE_URL=https://github.com/hadeskali-up/asai-chat
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_ASAI_API_BASE_URL=$NEXT_PUBLIC_ASAI_API_BASE_URL
ENV NEXT_PUBLIC_SOURCE_URL=$NEXT_PUBLIC_SOURCE_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace @oriveo/app

# ---- runtime -----------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=build /repo/ ./
RUN useradd --system --uid 10001 --create-home nextjs && chown -R nextjs:nextjs /repo
USER nextjs
# Next resolves the production `.next` directory relative to its working directory. The
# workspace build writes it under apps/app, while dependencies remain hoisted at /repo/node_modules.
WORKDIR /repo/apps/app
EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:3001/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

# Inside the container the server binds 0.0.0.0 so the host can reach it; the compose service
# publishes it only on 127.0.0.1:<hostport>, so the host reverse proxy is still the only way in.
CMD ["npx", "next", "start", "--hostname", "0.0.0.0", "--port", "3001"]
