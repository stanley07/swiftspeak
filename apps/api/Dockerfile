# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# Monorepo root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Workspaces and service code
COPY packages ./packages
COPY apps/api ./apps/api
COPY seed ./seed

RUN corepack enable && pnpm install --frozen-lockfile
# Build shared then API
RUN pnpm --filter @swiftspeak/shared build && pnpm --filter api build

# ---------- runtime stage ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080

# Copy runtime deps, seeds, and *the exact dist path*
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/seed ./seed
# keep dist where it was built:
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/apps/api/package.json /app/apps/api/package.json

EXPOSE 8080
# Run from the exact dist location
CMD ["node", "apps/api/dist/index.js"]
