# ====== Builder stage ======
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache bash libc6-compat openssl

WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml* ./

# Disable postinstall temporarily
RUN npm pkg delete scripts.postinstall

# Install all deps (including Prisma CLI)
RUN pnpm install --frozen-lockfile

# Copy rest of the code
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client
RUN pnpm prisma generate

# Build TypeScript
RUN pnpm build


# ====== Production stage ======
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache bash libc6-compat openssl

WORKDIR /app

# Copy package.json for metadata (not to reinstall)
COPY package.json pnpm-lock.yaml* ./

# Copy everything needed from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]