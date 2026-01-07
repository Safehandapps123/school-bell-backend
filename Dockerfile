# ================================
# 1. Base Stage
# ================================
FROM yossri65/my-node-base:latest AS base

RUN groupadd -r nodejs && useradd -r -g nodejs nodejs
WORKDIR /usr/src/app
RUN chown nodejs:nodejs /usr/src/app

# ================================
# 2. Dependencies (cached layer)
# ================================
FROM base AS dependencies
COPY package*.json ./
# Configure npm for better reliability
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --ignore-scripts

# ================================
# 3. Build Stage
# ================================
FROM dependencies AS build
# Copy only source code (so cache for deps not broken unless package.json changes)
COPY --chown=nodejs:nodejs . .
RUN npm run build

# ================================
# 4. Production Stage
# ================================
FROM yossri65/my-node-base@sha256:3b3e18b602d33cfe42021bb7a787571faf447c3ea22304ec482a291dd66af64f AS production
WORKDIR /usr/src/app

# Copy only package.json + install prod deps (cached if no change)
COPY package*.json ./
# Configure npm for better reliability and use --omit=dev instead of deprecated --only=production
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --omit=dev --ignore-scripts

# Copy compiled build
COPY --from=build --chown=nodejs:nodejs /usr/src/app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3800/api/v1', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/main.js"]
