# syntax=docker/dockerfile:1.6

# ---------- base ----------
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

# ---------- deps ----------
FROM base AS deps
# copy root manifests first for better caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# copy only the api package manifest(s)
COPY apps/api/package.json apps/api/package.json
# (if api depends on local packages, copy their package.json too)
# COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM base AS build
COPY . .
COPY --from=deps /app/node_modules ./node_modules
# build only the api package; adjust the filter to your workspace name or path
RUN pnpm -F "apps/api" build
# If your build outputs somewhere else, adjust (e.g., .output, build)

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
# copy runtime files
COPY --from=build /app/apps/api/dist ./dist
COPY apps/api/package.json ./package.json
# install only production deps for the api package
RUN corepack enable && pnpm install --prod --frozen-lockfile

EXPOSE 8080
# adjust entrypoint to your compiled file (Nest = main.js, Express = server.js, etc.)
CMD ["node", "dist/main.js"]
