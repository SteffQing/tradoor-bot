# ====== Builder stage ======
FROM node:20-alpine AS builder

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Prisma needs these
RUN apk add --no-cache bash libc6-compat openssl

WORKDIR /app

# Copy dependency files first
COPY package.json pnpm-lock.yaml* ./

# Disable postinstall temporarily so prisma generate doesn’t run too early
RUN npm pkg delete scripts.postinstall

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy rest of project
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Now that Prisma CLI is installed, generate client manually
RUN pnpm prisma generate

# Build TypeScript
RUN pnpm build


# ====== Production stage ======
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache bash libc6-compat openssl

WORKDIR /app

# Copy package files and only install production deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

# Copy Prisma client + compiled app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]