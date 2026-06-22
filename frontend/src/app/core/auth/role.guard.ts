import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { KeycloakAuthGuard, KeycloakService } from 'keycloak-angular';

/**
 * Garde de route basée sur les realm roles du JWT Keycloak.
 *
 * Utilisation dans la config de routes :
 *   { path: 'admin', canActivate: [RoleGuard], data: { roles: ['ADMIN'] } }
 *
 * Si aucun "data.roles" n'est défini, on exige juste d'être authentifié.
 */
@Injectable({ providedIn: 'root' })
export class RoleGuard extends KeycloakAuthGuard {
  constructor(protected override readonly router: Router,
              protected readonly keycloak: KeycloakService) {
    super(router, keycloak);
  }

  public async isAccessAllowed(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Promise<boolean> {
    if (!this.authenticated) {
      await this.keycloak.login({ redirectUri: window.location.origin + _state.url });
      return false;
    }
    const requiredRoles: string[] = (route.data && route.data['roles']) || [];
    if (requiredRoles.length === 0) return true;
    const ok = requiredRoles.some(r => this.roles.includes(r));
    if (!ok) {
      this.router.navigate(['/forbidden']);
    }
    return ok;
  }
}
