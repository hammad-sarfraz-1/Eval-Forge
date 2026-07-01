# Frontend image: Node + Next.js dev server.
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cached unless package.json changes).
COPY package.json .
RUN npm install

# Copy the app code.
COPY . .

EXPOSE 3000

# -H 0.0.0.0 makes the dev server reachable from outside the container.
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
