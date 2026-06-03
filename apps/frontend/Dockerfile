# syntax=docker/dockerfile:1

# Single install stage: build with all deps, then prune to prod-only.
# Uses node:22-slim (glibc) so native binaries are compatible with
# the Chainguard runner (also glibc/Wolfi).

FROM node:22-slim AS builder
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=secret,id=NODE_AUTH_TOKEN \
    echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/NODE_AUTH_TOKEN)" >> .npmrc && \
    pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
RUN pnpm prune --prod

FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:22 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4321
ENV HOST=0.0.0.0

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4321

ENTRYPOINT ["node"]
CMD ["./dist/server/entry.mjs"]
