# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json ./
COPY package-lock.json ./
# If you are using yarn, comment out the next line and uncomment the yarn lines
RUN npm install
# COPY yarn.lock ./
# RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN npm run build

# Production image
FROM node:18-alpine AS production

WORKDIR /app

# Copy built assets from the base stage
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json
# If you are using yarn, comment out the next line and uncomment the yarn lines
COPY --from=base /app/node_modules ./node_modules
# COPY --from=base /app/yarn.lock ./yarn.lock

# Expose port 3000
EXPOSE 3000

# Command to run the app
CMD ["npm", "start"]
# If you are using yarn, comment out the CMD above and uncomment the CMD below
# CMD ["yarn", "start"] 