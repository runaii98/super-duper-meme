FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

# Create credentials directory
RUN mkdir -p credentials

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"] 