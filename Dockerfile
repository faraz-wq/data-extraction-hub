# Use node alpine image for smaller size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 8080
EXPOSE 8080

# Build the application and start serving it using Vite's preview
CMD ["sh", "-c", "npm run build && npm run preview -- --host 0.0.0.0 --port 8080"]