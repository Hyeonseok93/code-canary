# Stage 1: Build React app inside Docker (repo root .env supplies VITE_*)
FROM node:22-alpine@sha256:968df39aedcea65eeb078fb336ed7191baf48f972b4479711397108be0966920 AS build

COPY .env /app/.env
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/index.html frontend/vite.config.ts frontend/tsconfig.json frontend/tsconfig.app.json frontend/tsconfig.node.json frontend/eslint.config.js ./
COPY frontend/public ./public
COPY frontend/src ./src

RUN npm run build

# Stage 2: Serve with non-root Nginx (listens on 8080)
FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:37f356a5eba5d187365b4f59cd6cc29f1f922ad18146d554b576a80983377e6a

COPY --chown=nginx:nginx --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
