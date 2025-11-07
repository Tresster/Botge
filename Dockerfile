FROM node:25.1.0-alpine AS base
WORKDIR /app

COPY docs ./docs
COPY LICENSE.txt README.md ./

COPY .husky ./.husky
COPY .npmrc ./

FROM base AS node-dependencies
WORKDIR /app
COPY --from=base /app ./

COPY package*.json ./

RUN npm ci --omit=dev --strict-peer-deps=true

FROM node-dependencies AS build-dependencies
WORKDIR /app
COPY --from=node-dependencies /app ./

RUN npm ci --strict-peer-deps=true

FROM build-dependencies AS build
WORKDIR /app
COPY --from=build-dependencies /app/ ./

COPY . .

RUN npm run build:production
RUN rm -r .husky && rm .npmrc

FROM base AS node
WORKDIR /app
COPY --from=base /app ./

RUN apk add --no-cache ffmpeg
RUN rm -r .husky && rm .npmrc

COPY --from=node-dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

LABEL org.opencontainers.image.title="Botge" \
  org.opencontainers.image.version="2.8.0" \
  org.opencontainers.image.description="Search emotes, clips, use zero-width emotes and other such commands." \
  org.opencontainers.image.url="https://botge.gitbook.io" \
  org.opencontainers.image.source="https://github.com/Tresster/Botge" \
  org.opencontainers.image.licenses="MIT" \
  org.opencontainers.image.authors="Tresster" \
  org.opencontainers.image.documentation="https://github.com/Tresster/Botge/tree/main/docs"

USER node

VOLUME ["/app/data", "/app/tmp"]

CMD ["node", "dist/index.js", "/app/data/command.txt"]
