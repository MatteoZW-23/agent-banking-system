# frontend.Dockerfile
FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY patches ./patches

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Expose Vite port (we'll map it to 3000 in docker-compose)
EXPOSE 5173

# Run vite dev server
CMD ["pnpm", "dev:client", "--host", "0.0.0.0"]
