import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PatientService } from '../../../core/services/patient.service';
import { Appointment, Patient } from '../../../models/models';

@Component({
  selector: 'app-mes-rdv',
  template: `
    <div class="container py-4">
      <h2 class="page-title mb-4"><i class="bi bi-calendar-event me-2"></i>Mes rendez-vous</h2>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <div *ngIf="!loading && rdvs.length === 0" class="alert alert-info">
        Aucun rendez-vous. <a routerLink="/patient/prendre-rdv">Prenez-en un</a> !
      </div>

      <div class="card" *ngIf="!loading && rdvs.length > 0">
        <table class="table table-striped mb-0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Médecin</th>
              <th>Motif</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of rdvs">
              <td>{{ r.dateHeure | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>#{{ r.doctorId }}</td>
              <td>{{ r.motif }}</td>
              <td><span class="badge badge-status-{{ r.statut }}">{{ r.statut }}</span></td>
              <td>
                <button class="btn btn-sm btn-outline-danger"
                        *ngIf="r.statut === 'PENDING' || r.statut === 'CONFIRMED'"
                        (click)="cancel(r)">Annuler</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="alert alert-danger mt-3" *ngIf="error">{{ error }}</div>
    </div>
  `
})
export class MesRdvComponent implements OnInit {
  rdvs: Appointment[] = [];
  loading = true;
  error: string | null = null;
  patient: Patient | null = null;

  constructor(
    private patientApi: PatientService,
    private apptApi: AppointmentService
  ) {}

  ngOnInit(): void {
    this.patientApi.me().subscribe({
      next: p => {
        this.patient = p;
        if (p.id == null) { this.loading = false; this.rdvs = []; return; }
        this.apptApi.byPatient(p.id).subscribe({
          next: r => { this.rdvs = r; this.loading = false; },
          error: e => { this.error = 'Erreur chargement RDV: ' + (e.message || e); this.loading = false; }
        });
      },
      error: e => {
        this.error = "Patient introuvable (le compte Keycloak n'est pas encore relié à une fiche patient). " +
                     "Demandez à l'admin de lier votre compte.";
        this.loading = false;
      }
    });
  }

  cancel(r: Appointment): void {
    if (r.id == null) return;
    this.apptApi.cancel(r.id).subscribe({
      next: updated => Object.assign(r, updated),
      error: e => this.error = 'Erreur annulation: ' + (e.message || e)
    });
  }
}
