// Environnement PROD : valeurs injectées au build par les --build-arg du Dockerfile
// (voir frontend/Dockerfile) — défauts cohérents pour docker-compose
export const environment = {
  production: true,
  apiBase: 'http://localhost:8080',
  keycloak: {
    url: 'http://localhost:8180',
    realm: 'medconnect',
    clientId: 'medconnect-frontend'
  }
};
