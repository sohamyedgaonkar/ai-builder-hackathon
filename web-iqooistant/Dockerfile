# Stage 1: Build the Vite React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy project files
COPY . ./

# Accept API key and Vertex AI build arguments
ARG VITE_OPENROUTER_API_KEY
ENV VITE_OPENROUTER_API_KEY=$VITE_OPENROUTER_API_KEY
ARG VITE_VERTEX_AI_KEY
ENV VITE_VERTEX_AI_KEY=$VITE_VERTEX_AI_KEY

# Build production bundle into /app/dist
RUN npm run build

# Stage 2: Serve with ultra-lightweight Nginx (Alpine) (~25MB image)
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration optimized for Cloud Run
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy runtime env generator for Cloud Run environment variables
COPY generate-env.sh /docker-entrypoint.d/40-generate-env.sh
RUN chmod +x /docker-entrypoint.d/40-generate-env.sh

# Cloud Run routes to port 8080 by default
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
