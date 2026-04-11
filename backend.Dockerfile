# backend.Dockerfile
FROM node:20-slim

# Install system dependencies for node-pg and other libs
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install pnpm (since the project uses it)
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY patches ./patches

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Expose backend port
EXPOSE 3000

# Run the dev server
CMD ["pnpm", "dev"]
