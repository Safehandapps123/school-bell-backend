# syntax=docker/dockerfile:1.4

# ==================================
# Stage 1: Install ALL dependencies
# ==================================
FROM node:20.18.1-alpine3.20 AS deps

RUN apk add --no-cache \
    python3 make g++ \
    cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev

WORKDIR /app

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline

# ==================================
# Stage 2: Build
# ==================================
FROM deps AS builder

COPY . .

RUN npm run build

# ==================================
# Stage 3: Production deps ONLY
# ==================================
FROM node:20.18.1-alpine3.20 AS prod-deps

RUN apk add --no-cache \
    python3 make g++ \
    cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev

WORKDIR /app

COPY package.json package-lock.json ./

# ✅ Install production deps INSIDE Docker
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts --prefer-offline && \
    npm cache clean --force && \
    # Force remove any remaining dev deps
    rm -rf \
        node_modules/typescript \
        node_modules/prettier \
        node_modules/webpack \
        node_modules/@swc \
        node_modules/@babel \
        node_modules/@angular-devkit \
        node_modules/@types \
        node_modules/.cache \
        /tmp/* && \
    echo "✅ Production node_modules size:" && \
    du -sh node_modules

# ==================================
# Stage 4: Final production image
# ==================================
FROM node:20.18.1-alpine3.20

RUN apk add --no-cache \
    cairo jpeg pango giflib pixman \
    libc6-compat libstdc++ \
    tini curl && \
    rm -rf /var/cache/apk/*

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Create logs directory with correct permissions BEFORE switching to nodejs user
RUN mkdir -p logs && chown -R nodejs:nodejs logs

ENV NODE_ENV=production \
    TZ=Africa/Cairo \
    PORT=3000

# ✅ Copy from STAGES, not from local!
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]