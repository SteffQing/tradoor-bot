# ====== Builder stage ======
FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apt-get update -y && apt-get install -y bash openssl

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
FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apt-get update -y && apt-get install -y bash openssl

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