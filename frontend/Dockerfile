# Build arguments for metadata and versioning
ARG APP_VERSION=0.2.0
ARG BUILD_DATE
ARG VCS_REF
ARG BUILD_PLATFORM

FROM node:25-alpine AS base

# Metadata labels
LABEL org.opencontainers.image.title="webepg-frontend" \
      org.opencontainers.image.description="WebEPG Frontend Application" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.platform="${BUILD_PLATFORM}" \
      org.opencontainers.image.source="https://github.com/your-org/webepg/frontend"

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable pnpm at the system level and set up pnpm config
RUN corepack enable pnpm && \
    pnpm config set store-dir /.pnpm-store

# Install dependencies based on the preferred package manager
COPY pnpm-lock.yaml package.json ./
RUN --mount=type=cache,id=pnpm,target=/.pnpm-store \
    pnpm install --frozen-lockfile

# Optional security scan stage (non-blocking)
FROM deps AS security-scan
RUN pnpm audit --audit-level=moderate || echo "Security audit completed with warnings"

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Enable pnpm for the builder stage
RUN corepack enable pnpm

# Copy configuration files first for better layer caching
# These change less frequently than source code
COPY next.config.ts tsconfig.json tailwind.config.ts postcss.config.mjs components.json ./
COPY biome.jsonc ./
COPY package.json pnpm-lock.yaml ./

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code and other files needed for build
# .dockerignore will exclude unnecessary files
COPY . .

# Build arguments available in build stage
ARG APP_VERSION
ARG NEXT_PUBLIC_APP_VERSION

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_APP_VERSION="${NEXT_PUBLIC_APP_VERSION:-${APP_VERSION}}"

# Build the application
RUN --mount=type=cache,target=/app/.next/cache \
    pnpm run build

# Verify standalone output exists (fail fast if build didn't produce expected output)
RUN test -d .next/standalone || (echo "Error: .next/standalone not found" && exit 1)

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Build arguments for metadata
ARG APP_VERSION
ARG BUILD_DATE
ARG VCS_REF

# Production environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Add metadata labels to final image
LABEL org.opencontainers.image.title="webepg-frontend" \
      org.opencontainers.image.description="WebEPG Frontend Application" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.source="https://github.com/your-org/webepg/frontend"

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only the necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set the correct user before creating any directories
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

ENV PORT=3000
# Ensure we listen on all network interfaces
ENV HOSTNAME="0.0.0.0"

# Add healthcheck using node instead of wget (more reliable in alpine)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use array syntax for better signal handling
# Note: For multi-platform builds, use: docker buildx build --platform linux/amd64,linux/arm64 -t your-image .
CMD ["node", "server.js"]