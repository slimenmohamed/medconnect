import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentService } from '../../../core/services/appointment.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { PatientService } from '../../../core/services/patient.service';
import { Doctor, Patient } from '../../../models/models';

@Component({
  selector: 'app-prendre-rdv',
  template: `
    <div class="container py-4">
      <h2 class="page-title mb-4"><i class="bi bi-calendar-plus me-2"></i>Prendre un rendez-vous</h2>

      <div class="card p-4">
        <form (ngSubmit)="submit()" #f="ngForm">
          <div class="mb-3">
            <label class="form-label">Médecin</label>
            <select class="form-select" [(ngModel)]="doctorId" name="doctorId" required>
              <option [ngValue]="null" disabled>-- Choisir --</option>
              <option *ngFor="let d of doctors" [ngValue]="d.id">
                Dr {{ d.nom }} {{ d.prenom }} ({{ d.specialite }})
              </option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Date & heure</label>
            <input type="datetime-local" class="form-control" [(ngModel)]="dateHeure" name="dateHeure" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Motif</label>
            <textarea class="form-control" rows="3" [(ngModel)]="motif" name="motif"></textarea>
          </div>
          <button class="btn btn-primary" [disabled]="!f.valid || sending">
            <span *ngIf="sending" class="spinner-border spinner-border-sm me-2"></span>
            Demander le rendez-vous
          </button>
        </form>
      </div>

      <div class="alert alert-success mt-3" *ngIf="success">Rendez-vous demandé ! Statut initial: PENDING.</div>
      <div class="alert alert-danger mt-3" *ngIf="error">{{ error }}</div>
    </div>
  `
})
export class PrendreRdvComponent implements OnInit {
  doctors: Doctor[] = [];
  doctorId: number | null = null;
  dateHeure = '';
  motif = '';
  patient: Patient | null = null;
  sending = false;
  success = false;
  error: string | null = null;

  constructor(
    private docApi: DoctorService,
    private patientApi: PatientService,
    private apptApi: AppointmentService,
    private router: Router
  ) {}

  ngOnInit() {
    this.docApi.list().subscribe({
      next: d => this.doctors = d,
      error: e => this.error = 'Impossible de charger les médecins: ' + (e.message || e)
    });
    this.patientApi.me().subscribe({
      next: p => this.patient = p,
      error: _ => this.error = "Compte non lié à une fiche patient ; contactez l'admin."
    });
  }

  submit() {
    if (!this.patient?.id || !this.doctorId) return;
    this.sending = true;
    this.error = null;
    this.apptApi.create({
      patientId: this.patient.id,
      doctorId: this.doctorId,
      dateHeure: new Date(this.dateHeure).toISOString(),
      motif: this.motif
    }).subscribe({
      next: () => {
        this.sending = false;
        this.success = true;
        setTimeout(() => this.router.navigate(['/patient/mes-rdv']), 1200);
      },
      error: e => {
        this.sending = false;
        this.error = 'Erreur création: ' + (e.message || e);
      }
    });
  }
}
