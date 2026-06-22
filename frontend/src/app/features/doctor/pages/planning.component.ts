import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../../../core/services/appointment.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { Appointment, Doctor } from '../../../models/models';

@Component({
  selector: 'app-planning',
  template: `
    <div class="container py-4">
      <h2 class="page-title mb-4"><i class="bi bi-calendar3 me-2"></i>Mon planning</h2>

      <div class="mb-3">
        <label class="form-label">Sélectionner un médecin :</label>
        <select class="form-select" [(ngModel)]="selectedDoctorId" (change)="loadRdvs()">
          <option [ngValue]="null" disabled>-- Médecin --</option>
          <option *ngFor="let d of doctors" [ngValue]="d.id">
            Dr {{ d.nom }} {{ d.prenom }} ({{ d.specialite }})
          </option>
        </select>
        <small class="text-muted">
          En production, la fiche médecin serait récupérée automatiquement via le sub Keycloak.
          Ici on laisse le choix pour la démo.
        </small>
      </div>

      <div *ngIf="loading" class="text-center py-4">
        <div class="spinner-border text-primary"></div>
      </div>

      <div class="card" *ngIf="!loading && rdvs.length > 0">
        <table class="table mb-0">
          <thead>
            <tr><th>Date</th><th>Patient</th><th>Motif</th><th>Statut</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of rdvs">
              <td>{{ r.dateHeure | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>#{{ r.patientId }}</td>
              <td>{{ r.motif }}</td>
              <td><span class="badge badge-status-{{ r.statut }}">{{ r.statut }}</span></td>
              <td>
                <button class="btn btn-sm btn-success me-2"
                        *ngIf="r.statut === 'PENDING'"
                        (click)="confirm(r)">
                  <i class="bi bi-check-circle me-1"></i>Confirmer
                </button>
                <a class="btn btn-sm btn-primary"
                   *ngIf="r.statut === 'CONFIRMED'"
                   [routerLink]="['/doctor/rdv', r.id, 'prescription']">
                  <i class="bi bi-capsule me-1"></i>Prescription
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="!loading && rdvs.length === 0 && selectedDoctorId != null"
           class="alert alert-info">Aucun rendez-vous pour ce médecin.</div>

      <div class="alert alert-danger mt-3" *ngIf="error">{{ error }}</div>
    </div>
  `
})
export class PlanningComponent implements OnInit {
  doctors: Doctor[] = [];
  selectedDoctorId: number | null = null;
  rdvs: Appointment[] = [];
  loading = false;
  error: string | null = null;

  constructor(private docApi: DoctorService, private apptApi: AppointmentService) {}

  ngOnInit(): void {
    this.docApi.list().subscribe({
      next: d => {
        this.doctors = d;
        if (d.length > 0 && d[0].id != null) {
          this.selectedDoctorId = d[0].id;
          this.loadRdvs();
        }
      },
      error: e => this.error = 'Erreur chargement médecins: ' + (e.message || e)
    });
  }

  loadRdvs() {
    if (this.selectedDoctorId == null) return;
    this.loading = true;
    this.apptApi.byDoctor(this.selectedDoctorId).subscribe({
      next: r => { this.rdvs = r; this.loading = false; },
      error: e => { this.error = 'Erreur: ' + (e.message || e); this.loading = false; }
    });
  }

  /** Scénario SYNC + ASYNC : confirme un RDV (Feign + RabbitMQ côté backend). */
  confirm(r: Appointment) {
    if (r.id == null) return;
    this.apptApi.confirm(r.id).subscribe({
      next: updated => Object.assign(r, updated),
      error: e => this.error = 'Erreur confirmation: ' + (e.message || e)
    });
  }
}
