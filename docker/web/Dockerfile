# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps

WORKDIR /app

COPY web/package*.json ./
RUN npm ci

# Dev image: dependencies only; source is bind-mounted at runtime.
FROM deps AS development

ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3008
CMD ["npx", "next", "dev", "--turbopack", "-H", "0.0.0.0", "-p", "3008"]

FROM deps AS builder

WORKDIR /app
COPY web/ ./

ARG BACKEND_ORIGIN=http://api:3007
ARG NEXT_PUBLIC_BACKEND_ORIGIN=http://api:3007
ARG NEXT_PUBLIC_API_URL=https://api.be-u.ai/api

ENV BACKEND_ORIGIN=$BACKEND_ORIGIN \
    NEXT_PUBLIC_BACKEND_ORIGIN=$NEXT_PUBLIC_BACKEND_ORIGIN \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:20-bookworm-slim AS production

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3008 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

ARG BACKEND_ORIGIN=http://api:3007
ARG NEXT_PUBLIC_BACKEND_ORIGIN=http://api:3007
ARG NEXT_PUBLIC_API_URL=https://api.be-u.ai/api

ENV BACKEND_ORIGIN=$BACKEND_ORIGIN \
    NEXT_PUBLIC_BACKEND_ORIGIN=$NEXT_PUBLIC_BACKEND_ORIGIN \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

USER nextjs
EXPOSE 3008
CMD ["node", "server.js"]
