import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';

/**
 * Initialiseur Keycloak appelé par APP_INITIALIZER.
 * - SSO check au démarrage (check-sso), pas de redirection forcée :
 *   l'utilisateur peut voir la home et cliquer "Connexion".
 * - PKCE S256 (client public)
 * - Refresh automatique des tokens
 * - L'intercepteur KeycloakBearerInterceptor injecte le token aux
 *   requêtes vers apiBase.
 */
export function initializeKeycloak(keycloak: KeycloakService): () => Promise<boolean> {
  return () =>
    keycloak.init({
      config: {
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
        pkceMethod: 'S256',
        checkLoginIframe: false
      },
      // NB : on NE charge PAS le profil au démarrage. Cela déclencherait
      // un appel à http://keycloak:8180/realms/medconnect/account qui
      // requiert le rôle "manage-account" + un CORS spécifique côté
      // Keycloak (Account REST API). Le preferred_username est déjà dans
      // le JWT, on le lit directement via tokenParsed (voir AuthService).
      loadUserProfileAtStartUp: false,
      enableBearerInterceptor: true,
      bearerExcludedUrls: ['/assets'],
      bearerPrefix: 'Bearer'
    });
}
