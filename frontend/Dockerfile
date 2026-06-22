# =========================================================
# Dockerfile multi-stage pour le frontend Angular
# =========================================================

# ---- 1) BUILD ----
FROM node:20-alpine AS build
WORKDIR /app

ARG KEYCLOAK_URL=http://localhost:8180
ARG KEYCLOAK_REALM=medconnect
ARG KEYCLOAK_CLIENT_ID=medconnect-frontend
ARG API_BASE=http://localhost:8080

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .

# On regénère environment.prod.ts avec les valeurs build-time
RUN printf "export const environment = {\n\
  production: true,\n\
  apiBase: '%s',\n\
  keycloak: {\n\
    url: '%s',\n\
    realm: '%s',\n\
    clientId: '%s'\n\
  }\n\
};\n" "$API_BASE" "$KEYCLOAK_URL" "$KEYCLOAK_REALM" "$KEYCLOAK_CLIENT_ID" \
  > src/environments/environment.prod.ts

RUN npx ng build --configuration production

# ---- 2) RUNTIME ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/medconnect /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD wget -q -O /dev/null http://localhost:80/ || exit 1
