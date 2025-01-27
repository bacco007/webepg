FROM node:23-alpine AS base

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
# Use --prod flag to only install production dependencies in the deps stage
RUN --mount=type=cache,id=pnpm,target=/.pnpm-store \
    pnpm install --frozen-lockfile --prod

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Enable pnpm for the builder stage
RUN corepack enable pnpm

# Copy only the files needed for the build
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN --mount=type=cache,target=/app/.next/cache \
    pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir .next && \
    chown nextjs:nodejs .next

# Copy only the necessary files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set the correct user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

ENV PORT 3000
# Ensure we listen on all network interfaces
ENV HOSTNAME "0.0.0.0"

# Use array syntax for better signal handling
CMD ["node", "server.js"]
