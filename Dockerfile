ARG NODE_VERSION=23.3.0

FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

FROM node:${NODE_VERSION}-alpine AS release

WORKDIR /app

RUN apk add --update ffmpeg

COPY package*.json .

RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

USER node

VOLUME ["/app/tmp"]
VOLUME ["/app/data"]

CMD ["node", "dist/index.js"]