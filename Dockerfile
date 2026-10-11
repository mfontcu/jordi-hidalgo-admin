# Production image: static build served by nginx (ADR-003). VITE_API_BASE_URL is required.
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci --ignore-scripts

COPY . .

ARG VITE_API_BASE_URL
RUN test -n "$VITE_API_BASE_URL" || (echo "VITE_API_BASE_URL build arg is required" >&2 && exit 1)
RUN npm run build && rm -rf dist/.vite

FROM nginx:1.29-alpine

ARG VITE_API_BASE_URL
# Substituted into the nginx templates at container start (CSP connect-src).
ENV API_ORIGIN=${VITE_API_BASE_URL}

COPY deploy/default.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/security-headers.conf.template /etc/nginx/templates/snippets/security-headers.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
