# ====== Builder stage ======
FROM node:20-alpine AS builder

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install Alpine deps needed by Prisma
RUN apk add --no-cache bash libc6-compat openssl

WORKDIR /app

# Copy package files first for caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source and config
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client
RUN pnpm prisma generate

# Build TypeScript
RUN pnpm build

# ====== Production stage ======
FROM node:20-alpine

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install Alpine deps needed by Prisma
RUN apk add --no-cache bash libc6-compat openssl

WORKDIR /app

# Copy package files and install only production dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

# Copy Prisma client and compiled code from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set environment
ENV NODE_ENV=production

# Run bot
CMD ["node", "dist/index.js"]