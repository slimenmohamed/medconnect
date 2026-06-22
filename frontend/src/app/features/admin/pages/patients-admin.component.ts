import { Component, OnInit } from '@angular/core';
import { PatientService } from '../../../core/services/patient.service';
import { Patient } from '../../../models/models';

@Component({
  selector: 'app-patients-admin',
  template: `
    <div class="container py-4">
      <h2 class="page-title mb-4"><i class="bi bi-people me-2"></i>Gestion des patients</h2>

      <div class="card p-3 mb-4">
        <h5>+ Ajouter un patient</h5>
        <div class="row g-2">
          <div class="col-md-2"><input class="form-control" placeholder="Nom"      [(ngModel)]="form.nom"></div>
          <div class="col-md-2"><input class="form-control" placeholder="Prénom"   [(ngModel)]="form.prenom"></div>
          <div class="col-md-3"><input class="form-control" placeholder="Email"    [(ngModel)]="form.email"></div>
          <div class="col-md-2"><input class="form-control" placeholder="Tél"      [(ngModel)]="form.telephone"></div>
          <div class="col-md-2"><input class="form-control" placeholder="KeycloakId (sub)" [(ngModel)]="form.keycloakId"></div>
          <div class="col-md-1"><button class="btn btn-primary w-100" (click)="create()">+</button></div>
        </div>
        <small class="text-muted mt-2">
          Le champ <code>KeycloakId</code> = <code>sub</code> du JWT du compte patient.
          Une fois rempli, le patient peut se connecter et voir "ses" RDV / "son" dossier médical.
        </small>
      </div>

      <div class="card">
        <table class="table mb-0 align-middle">
          <thead><tr>
            <th>ID</th><th>Nom</th><th>Prénom</th><th>Email</th><th>Tél</th><th>KeycloakId</th><th style="width:170px"></th>
          </tr></thead>
          <tbody>
            <ng-container *ngFor="let p of patients">
              <tr *ngIf="editing?.id !== p.id">
                <td>{{ p.id }}</td>
                <td>{{ p.nom }}</td>
                <td>{{ p.prenom }}</td>
                <td>{{ p.email }}</td>
                <td>{{ p.telephone }}</td>
                <td><code>{{ p.keycloakId || '—' }}</code></td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-1" (click)="startEdit(p)" title="Modifier">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="del(p)" title="Supprimer">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="editing?.id === p.id" class="table-warning">
                <td>{{ p.id }}</td>
                <td><input class="form-control form-control-sm" [(ngModel)]="editing!.nom"></td>
                <td><input class="form-control form-control-sm" [(ngModel)]="editing!.prenom"></td>
                <td><input class="form-control form-control-sm" [(ngModel)]="editing!.email"></td>
                <td><input class="form-control form-control-sm" [(ngModel)]="editing!.telephone"></td>
                <td><input class="form-control form-control-sm" [(ngModel)]="editing!.keycloakId" placeholder="sub du JWT"></td>
                <td class="text-end">
                  <button class="btn btn-sm btn-success me-1" (click)="saveEdit()" title="Enregistrer">
                    <i class="bi bi-check-lg"></i>
                  </button>
                  <button class="btn btn-sm btn-secondary" (click)="cancelEdit()" title="Annuler">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>
      </div>

      <div class="alert alert-danger mt-3" *ngIf="error">{{ error }}</div>
    </div>
  `
})
export class PatientsAdminComponent implements OnInit {
  patients: Patient[] = [];
  form: Patient = { nom: '', prenom: '' };
  editing: Patient | null = null;
  error: string | null = null;

  constructor(private api: PatientService) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.list().subscribe({
      next: l => this.patients = l,
      error: e => this.error = e.message || 'Erreur chargement'
    });
  }

  create() {
    if (!this.form.nom || !this.form.prenom) return;
    this.api.create(this.form).subscribe({
      next: _ => { this.form = { nom: '', prenom: '' }; this.load(); },
      error: e => this.error = e.message || 'Erreur création'
    });
  }

  startEdit(p: Patient) {
    this.editing = { ...p };
    this.error = null;
  }

  cancelEdit() { this.editing = null; }

  saveEdit() {
    if (!this.editing || this.editing.id == null) return;
    this.api.update(this.editing.id, this.editing).subscribe({
      next: _ => { this.editing = null; this.load(); },
      error: e => this.error = e.error?.message || e.message || 'Erreur mise à jour'
    });
  }

  del(p: Patient) {
    if (p.id == null) return;
    if (!confirm(`Supprimer le patient ${p.prenom} ${p.nom} ?`)) return;
    this.api.delete(p.id).subscribe({
      next: _ => this.load(),
      error: e => this.error = e.error?.message || e.message || 'Erreur suppression'
    });
  }
}
