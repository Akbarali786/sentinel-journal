# Build & Production Container for Sentinel Journal on Google Cloud Run
FROM node:22-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy project files
COPY . .

# Build the frontend and backend bundle
RUN npm run build

# Production runtime stage
FROM node:22-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

# Expose container port
EXPOSE 3000

# Non-root user for security
USER node

# Start the compiled Express server
CMD ["node", "dist/server.cjs"]
