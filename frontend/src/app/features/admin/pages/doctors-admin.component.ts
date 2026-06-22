import { Component, OnInit } from '@angular/core';
import { DoctorService } from '../../../core/services/doctor.service';
import { Doctor } from '../../../models/models';

@Component({
  selector: 'app-doctors-admin',
  template: `
    <div class="container py-4">
      <h2 class="page-title mb-4"><i class="bi bi-person-badge me-2"></i>Gestion des médecins</h2>

      <div class="card p-3 mb-4">
        <h5>+ Ajouter un médecin</h5>
        <div class="row g-2">
          <div class="col-md-3"><input class="form-control" placeholder="Nom"        [(ngModel)]="form.nom"></div>
          <div class="col-md-3"><input class="form-control" placeholder="Prénom"     [(ngModel)]="form.prenom"></div>
          <div class="col-md-3"><input class="form-control" placeholder="Spécialité" [(ngModel)]="form.specialite"></div>
          <div class="col-md-2"><input class="form-control" placeholder="KeycloakId" [(ngModel)]="form.keycloakId"></div>
          <div class="col-md-1"><button class="btn btn-primary w-100" (click)="create()">+</button></div>
        </div>
        <small class="text-muted mt-2">
          Le champ <code>KeycloakId</code> = <code>sub</code> du JWT du compte médecin.
          Une fois rempli, le médecin voit son propre planning + peut créer des prescriptions.
        </small>
      </div>

      <div class="card">
        <table class="table mb-0 align-middle">
          <thead><tr>
            <th>ID</th><th>Nom</th><th>Prénom</th><th>Spécialité</th><th>KeycloakId</th><th style="width:170px"></th>
          </tr></thead>
          <tbody>
            <ng-container *ngFor="let d of doctors">
              <tr *ngIf="editing?.id !== d.id">
                <td>{{ d.id }}</td>
                <td>{{ d.nom }}</td>
                <td>{{ d.prenom }}</td>
                <td>{{ d.specialite }}</td>
                <td><code>{{ d.keycloakId || '—' }}</code></td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-1" (click)="startEdit(d)" title="Modifier">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="del(d)" title="Supprimer">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="editing?.id === d.id" class="table-warning">
                <td>{{ d.id }}</td>
                <td><input class="form-control form-control-sm" [(ngModel)]="editing!.nom"></td>
                <td><input class="form-control form-control-sm" [(ngModel)]="editing!.prenom"></td>
                <td><input class="form-control form-control-sm" [(ngModel)]="editing!.specialite"></td>
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
export class DoctorsAdminComponent implements OnInit {
  doctors: Doctor[] = [];
  form: Doctor = { nom: '', prenom: '', specialite: '' };
  editing: Doctor | null = null;
  error: string | null = null;

  constructor(private api: DoctorService) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.list().subscribe({
      next: l => this.doctors = l,
      error: e => this.error = e.message || 'Erreur chargement'
    });
  }

  create() {
    if (!this.form.nom || !this.form.prenom || !this.form.specialite) return;
    this.api.create(this.form).subscribe({
      next: _ => { this.form = { nom: '', prenom: '', specialite: '' }; this.load(); },
      error: e => this.error = e.message || 'Erreur création'
    });
  }

  startEdit(d: Doctor) {
    this.editing = { ...d };
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

  del(d: Doctor) {
    if (d.id == null) return;
    if (!confirm(`Supprimer le Dr ${d.prenom} ${d.nom} ?`)) return;
    this.api.delete(d.id).subscribe({
      next: _ => this.load(),
      error: e => this.error = e.error?.message || e.message || 'Erreur suppression'
    });
  }
}
