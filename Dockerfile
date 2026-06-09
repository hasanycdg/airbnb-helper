# syntax=docker/dockerfile:1

# ──────────────────────────────────────────────────────────────────────────
# StayGuide Pro — image for test deployments.
# Two stages: `builder` installs full deps and builds; `runner` carries the
# built app + linux node_modules so the entrypoint can run `prisma db push`
# (and optional seed) before `next start`.
# Debian-slim (not Alpine) keeps Prisma's OpenSSL query engine happy.
# ──────────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# OpenSSL is required by Prisma's query engine at generate/build time.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values are inlined into client bundles at BUILD time, so the
# public URL has to be known here — not only at runtime. Passed in via the
# compose build arg (see docker-compose.yml).
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# `build` runs `prisma generate && next build` (see package.json).
RUN npm run build

# ──────────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Carry the entire built app (incl. the linux node_modules with the Prisma
# CLI, tsx and the generated client) so the entrypoint can migrate + seed.
COPY --from=builder /app ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
