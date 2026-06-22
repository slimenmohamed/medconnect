import { Component, OnInit } from '@angular/core';
import { PatientService } from '../../../core/services/patient.service';
import { RecordService } from '../../../core/services/record.service';
import { PrescriptionService } from '../../../core/services/prescription.service';
import { MedicalRecord, Patient, Prescription } from '../../../models/models';

@Component({
  selector: 'app-mon-dossier',
  template: `
    <div class="container py-4">
      <h2 class="page-title mb-4"><i class="bi bi-folder2-open me-2"></i>Mon dossier médical</h2>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <ng-container *ngIf="!loading">
        <div class="alert alert-warning" *ngIf="!record">
          Aucun dossier médical pour l'instant. Il sera créé automatiquement après
          confirmation de votre premier rendez-vous (événement RabbitMQ
          <code>appointment.confirmed</code>).
        </div>

        <div class="card mb-4" *ngIf="record">
          <div class="card-body">
            <h5 class="card-title">Informations</h5>
            <p><b>Groupe sanguin:</b> {{ record.groupeSanguin || '—' }}</p>
            <p><b>Allergies:</b> {{ record.allergies || '—' }}</p>
            <p><b>Antécédents:</b> {{ record.antecedents || '—' }}</p>

            <h6 class="mt-4">Notes du médecin</h6>
            <ul class="list-group" *ngIf="(record.notes || []).length > 0">
              <li class="list-group-item" *ngFor="let n of record.notes">
                <small class="text-muted">{{ n.date | date:'dd/MM/yyyy HH:mm' }}</small><br>
                {{ n.contenu }}
              </li>
            </ul>
            <p *ngIf="(record.notes || []).length === 0" class="text-muted">Aucune note.</p>
          </div>
        </div>

        <h4 class="mb-3"><i class="bi bi-capsule me-2"></i>Mes prescriptions</h4>
        <div class="alert alert-info" *ngIf="prescriptions.length === 0">Aucune prescription.</div>
        <div class="card mb-2" *ngFor="let p of prescriptions">
          <div class="card-body">
            <small class="text-muted">{{ p.dateCreation | date:'dd/MM/yyyy HH:mm' }} - médecin #{{ p.doctorId }}</small>
            <ul class="mt-2 mb-0">
              <li *ngFor="let m of p.medicaments">
                <b>{{ m.nom }}</b> - {{ m.dosage }} ({{ m.duree }})
              </li>
            </ul>
          </div>
        </div>
      </ng-container>

      <div class="alert alert-danger mt-3" *ngIf="error">{{ error }}</div>
    </div>
  `
})
export class MonDossierComponent implements OnInit {
  patient: Patient | null = null;
  record: MedicalRecord | null = null;
  prescriptions: Prescription[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private patientApi: PatientService,
    private recordApi: RecordService,
    private prescApi: PrescriptionService
  ) {}

  ngOnInit(): void {
    this.patientApi.me().subscribe({
      next: p => {
        this.patient = p;
        if (p.id == null) { this.loading = false; return; }
        this.recordApi.byPatient(p.id).subscribe({
          next: r => { this.record = r; },
          error: _ => { this.record = null; }
        });
        this.prescApi.byPatient(p.id).subscribe({
          next: l => { this.prescriptions = l; this.loading = false; },
          error: _ => { this.loading = false; }
        });
      },
      error: _ => { this.error = 'Compte non lié à une fiche patient.'; this.loading = false; }
    });
  }
}
