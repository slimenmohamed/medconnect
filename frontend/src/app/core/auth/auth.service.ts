import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { Role } from '../../models/models';

/**
 * Wrapper léger autour de KeycloakService pour le confort des composants.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private keycloak: KeycloakService) {}

  isLoggedIn(): boolean { return this.keycloak.isLoggedIn(); }

  /** Lit le JWT déjà parsé par keycloak-js (aucun appel HTTP supplémentaire). */
  private tokenClaims(): any {
    return this.keycloak.getKeycloakInstance()?.tokenParsed || null;
  }

  username(): string {
    const t = this.tokenClaims();
    return (t?.preferred_username || t?.email || 'anonyme') as string;
  }

  roles(): string[] {
    const t = this.tokenClaims();
    return (t?.realm_access?.roles || []) as string[];
  }

  hasRole(r: Role): boolean { return this.roles().includes(r); }
  isPatient(): boolean { return this.hasRole('PATIENT'); }
  isDoctor():  boolean { return this.hasRole('DOCTOR');  }
  isAdmin():   boolean { return this.hasRole('ADMIN');   }

  /** Sub Keycloak (= keycloakId persisté côté backend). */
  async userId(): Promise<string | undefined> {
    const token = await this.keycloak.getToken();
    if (!token) return undefined;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub;
  }

  login()  { return this.keycloak.login(); }
  logout() { return this.keycloak.logout(window.location.origin); }
  account(){ return this.keycloak.getKeycloakInstance().accountManagement(); }
}
