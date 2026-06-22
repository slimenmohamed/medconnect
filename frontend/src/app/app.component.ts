import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <footer class="text-center py-3 text-muted small mt-5">
      + MedConnect &copy; 2026 - Projet académique (Applications Web Distribuées)
    </footer>
  `
})
export class AppComponent {}
