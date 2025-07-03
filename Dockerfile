FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S zaplite -u 1001

# Change ownership of the app directory
RUN chown -R zaplite:nodejs /app
USER zaplite

EXPOSE 3000

CMD ["npm", "start"]