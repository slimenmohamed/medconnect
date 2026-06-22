import { Component } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home',
  template: `
    <div class="container py-5">
      <div class="row align-items-center">
        <div class="col-lg-7">
          <h1 class="page-title display-5 mb-3">Bienvenue sur <span class="text-primary">MedConnect</span></h1>
          <p class="lead">
            La plateforme de gestion de cabinet médical : prenez vos rendez-vous,
            consultez votre dossier et vos prescriptions en quelques clics.
          </p>
          <div *ngIf="!auth.isLoggedIn()" class="mt-4">
            <button class="btn btn-primary btn-lg" (click)="auth.login()">
              <i class="bi bi-box-arrow-in-right me-2"></i> Se connecter
            </button>
          </div>
          <div *ngIf="auth.isLoggedIn()" class="mt-4">
            <div class="alert alert-info">
              Connecté en tant que <b>{{ auth.username() }}</b>
              avec les rôles <code>{{ auth.roles().join(', ') }}</code>.
              Utilisez le menu en haut pour naviguer.
            </div>
          </div>
        </div>
        <div class="col-lg-5 text-center">
          <i class="bi bi-heart-pulse-fill" style="font-size: 220px; color:#1976d2; opacity:.85"></i>
        </div>
      </div>
    </div>
  `
})
export class HomeComponent {
  constructor(public auth: AuthService) {}
}
