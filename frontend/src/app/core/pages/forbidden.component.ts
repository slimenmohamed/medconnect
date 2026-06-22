import { Component } from '@angular/core';

@Component({
  selector: 'app-forbidden',
  template: `
    <div class="container py-5 text-center">
      <i class="bi bi-shield-lock-fill text-danger" style="font-size: 80px"></i>
      <h2 class="mt-3">403 - Accès refusé</h2>
      <p>Vous n'avez pas les rôles requis pour accéder à cette page.</p>
      <a class="btn btn-primary" routerLink="/">Retour à l'accueil</a>
    </div>
  `
})
export class ForbiddenComponent {}
