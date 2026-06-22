// Environnement DEV (ng serve sur localhost:4200)
export const environment = {
  production: false,
  apiBase: 'http://localhost:8080',
  keycloak: {
    url: 'http://localhost:8180',
    realm: 'medconnect',
    clientId: 'medconnect-frontend'
  }
};
