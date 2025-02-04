# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copy all source files
COPY . .

# Expose port
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
