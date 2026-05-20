FROM node:20-slim AS build

WORKDIR /app

COPY client/package*.json ./client/
RUN cd client && npm ci

COPY client/ ./client/
RUN cd client && npm run build

COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/ ./server/

FROM node:20-slim
WORKDIR /app

COPY --from=build /app/server /app/server
COPY --from=build /app/client/dist /app/client/dist

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/data/offlinefirst.db

EXPOSE 3001
VOLUME ["/data"]

CMD ["node", "server/index.js"]
