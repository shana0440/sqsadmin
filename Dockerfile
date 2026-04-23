FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy the nitro output
COPY --from=builder --chown=appuser:nodejs /app/.output ./.output
COPY --from=builder /app/public ./public

USER appuser

EXPOSE 8086

ENV PORT=8086
ENV HOSTNAME=0.0.0.0

CMD ["node", ".output/server/index.mjs"]
