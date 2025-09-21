ARG NODE_VERSION=24.1.0

FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

FROM node:${NODE_VERSION}-alpine AS release

LABEL org.opencontainers.image.title="Botge" \
      org.opencontainers.image.version="2.1.0" \
      org.opencontainers.image.description="Search emotes, clips, use zero-width emotes and other such commands." \
      org.opencontainers.image.url="https://botge.gitbook.io" \
      org.opencontainers.image.source="https://github.com/Tresster/Botge" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.authors="Tresster" \
      org.opencontainers.image.documentation="https://botge.gitbook.io/botge/documentation"

WORKDIR /app

RUN apk add --no-cache ffmpeg

COPY package*.json .

RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/LICENSE /app/PRIVACY.md ./

USER node

VOLUME ["/app/tmp"]
VOLUME ["/app/data"]

CMD ["node", "dist/index.js", "/app/data/command.txt"]