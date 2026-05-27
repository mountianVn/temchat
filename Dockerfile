# TeamChat Dockerfile for Railway
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install root dependencies (if any)
RUN npm ci --omit=dev || true

# Install server dependencies
RUN cd server && npm install --omit=dev

# Install client dependencies and build
RUN cd client && npm install && npm run build

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start server
WORKDIR /app/server
CMD ["npm", "start"]
