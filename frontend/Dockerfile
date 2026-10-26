# Frontend image: builds the Vite app, then serves it with nginx.
# The API address is baked in at build time (it is public anyway):
#   docker build --build-arg VITE_API_BASE_URL=https://api.example.com -t typequest-web frontend

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

ARG VITE_API_BASE_URL=http://localhost:8080
ARG VITE_CONTACT_EMAIL=contact@your-domain.example
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://localhost/ || exit 1
