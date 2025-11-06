FROM node:25.1.0-alpine AS build

WORKDIR /app

COPY .husky ./.husky
COPY .npmrc package*.json ./
RUN npm ci

COPY . .
RUN npm run build:production

FROM node:25.1.0-alpine AS release
LABEL org.opencontainers.image.title="Botge" \
  org.opencontainers.image.version="2.7.2" \
  org.opencontainers.image.description="Search emotes, clips, use zero-width emotes and other such commands." \
  org.opencontainers.image.url="https://botge.gitbook.io" \
  org.opencontainers.image.source="https://github.com/Tresster/Botge" \
  org.opencontainers.image.licenses="MIT" \
  org.opencontainers.image.authors="Tresster" \
  org.opencontainers.image.documentation="https://github.com/Tresster/Botge/tree/main/docs"

WORKDIR /app

RUN apk add --no-cache ffmpeg

COPY .husky ./.husky
COPY .npmrc package*.json ./
RUN npm ci --omit=dev && rm -r .husky && rm .npmrc

COPY --from=build /app/dist ./dist
COPY docs ./docs
COPY LICENSE.md README.md ./

USER node

VOLUME ["/app/data", "/app/tmp"]

CMD ["node", "dist/index.js", "/app/data/command.txt"]
