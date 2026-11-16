# syntax=docker/dockerfile:1

# Expo/metro 58+ requires Node ^22.13 (or ^24 / >=26)
FROM node:22-bookworm-slim AS deps

WORKDIR /app

COPY mobile/package*.json mobile/.npmrc ./
RUN npm ci

# Dev: dependencies only; source bind-mounted at runtime.
FROM deps AS development

EXPOSE 3009
CMD ["npx", "expo", "start", "--web", "--port", "3009", "--host", "lan"]

FROM deps AS builder

WORKDIR /app
COPY mobile/ ./

ARG EXPO_PUBLIC_API_URL=https://api.be-u.ai
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL \
    CI=1

RUN npx expo export --platform web

FROM nginx:1.27-alpine AS production

COPY docker/mobile/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3009

CMD ["nginx", "-g", "daemon off;"]
