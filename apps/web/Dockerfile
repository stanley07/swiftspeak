# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Monorepo root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
# Workspaces + web app
COPY packages ./packages
COPY apps/web ./apps/web

RUN corepack enable && pnpm i --frozen-lockfile
# Build SDK first, then web (produces .next/standalone)
RUN pnpm --filter @swiftspeak/sdk build
RUN pnpm --filter web build
# Ensure public exists
RUN mkdir -p apps/web/public

# ---- runtime stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080 HOSTNAME=0.0.0.0

# Copy standalone output
COPY --from=build /app/apps/web/.next/standalone .
# Copy static assets
COPY --from=build /app/apps/web/.next/static ./.next/static
# Copy public assets
COPY --from=build /app/apps/web/public ./public

EXPOSE 8080
CMD ["node", "server.js"]
