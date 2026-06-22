# =========================================================
# Dockerfile pour medical-records-service (Node.js + Express)
# =========================================================
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl

COPY package.json ./
# On installe les deps sans lockfile pour rester portable
RUN npm install --omit=dev --no-audit --no-fund

COPY src ./src

EXPOSE 5001
HEALTHCHECK --interval=15s --timeout=5s --retries=10 --start-period=20s \
  CMD curl -fs http://localhost:5001/health || exit 1

CMD ["node", "src/server.js"]
