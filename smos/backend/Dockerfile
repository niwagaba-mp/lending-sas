# Stage 1: Build & test environment (Builder)
FROM node:18-alpine AS builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend ./

# Stage 2: Final production image
FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copy package descriptors and install only production dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY --from=builder /app/src ./src

# Copy database migrations so the self-contained container can run migrations on startup.
# The migration runner resolves this relative to /app/src/config via ../../../database (evaluating to /database).
COPY database /database

# Secure the runtime by running as a non-root user
USER node

EXPOSE 5000

CMD ["npm", "start"]
