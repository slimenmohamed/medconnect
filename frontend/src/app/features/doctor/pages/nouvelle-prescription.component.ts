import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PrescriptionService } from '../../../core/services/prescription.service';
import { Appointment, Medicament } from '../../../models/models';

@Component({
  selector: 'app-nouvelle-prescription',
  template: `
    <div class="container py-4">
      <h2 class="page-title mb-4"><i class="bi bi-capsule me-2"></i>Nouvelle prescription</h2>

      <div class="alert alert-info" *ngIf="appt">
        Pour le RDV #{{ appt.id }} - Patient #{{ appt.patientId }}
        ({{ appt.dateHeure | date:'dd/MM/yyyy HH:mm' }})
      </div>

      <div class="card p-4">
        <h5>Médicaments</h5>
        <div *ngFor="let m of medicaments; let i = index" class="row g-2 mb-2">
          <div class="col-md-4">
            <input class="form-control" placeholder="Nom" [(ngModel)]="m.nom" name="nom{{i}}">
          </div>
          <div class="col-md-3">
            <input class="form-control" placeholder="Dosage (ex: 500mg x3/j)"
                   [(ngModel)]="m.dosage" name="dosage{{i}}">
          </div>
          <div class="col-md-3">
            <input class="form-control" placeholder="Durée (ex: 7 jours)"
                   [(ngModel)]="m.duree" name="duree{{i}}">
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-danger w-100" (click)="remove(i)"
                    *ngIf="medicaments.length > 1">Retirer</button>
          </div>
        </div>
        <button class="btn btn-outline-primary mt-2" (click)="add()">+ Ajouter un médicament</button>

        <hr>
        <button class="btn btn-primary" [disabled]="sending" (click)="submit()">
          <span *ngIf="sending" class="spinner-border spinner-border-sm me-2"></span>
          Valider la prescription
        </button>
      </div>

      <div class="alert alert-success mt-3" *ngIf="success">
        Prescription créée. Événement <code>prescription.created</code> publié sur RabbitMQ -
        le RDV sera marqué <b>COMPLETED</b> par appointment-service.
      </div>
      <div class="alert alert-danger mt-3" *ngIf="error">{{ error }}</div>
    </div>
  `
})
export class NouvellePrescriptionComponent implements OnInit {
  apptId!: number;
  appt: Appointment | null = null;
  medicaments: Medicament[] = [{ nom: '', dosage: '', duree: '' }];
  sending = false;
  success = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apptApi: AppointmentService,
    private prescApi: PrescriptionService
  ) {}

  ngOnInit(): void {
    this.apptId = Number(this.route.snapshot.paramMap.get('id'));
  }

  add()    { this.medicaments.push({ nom: '', dosage: '', duree: '' }); }
  remove(i: number) { this.medicaments.splice(i, 1); }

  submit() {
    this.sending = true;
    this.error = null;
    this.apptApi.all().subscribe({
      next: list => {
        const a = list.find(x => x.id === this.apptId);
        if (!a) { this.error = 'RDV introuvable'; this.sending = false; return; }
        this.prescApi.create({
          patientId: a.patientId,
          doctorId:  a.doctorId,
          appointmentId: a.id!,
          medicaments: this.medicaments.filter(m => m.nom.trim().length > 0)
        }).subscribe({
          next: () => {
            this.sending = false;
            this.success = true;
            setTimeout(() => this.router.navigate(['/doctor/planning']), 1500);
          },
          error: e => { this.error = 'Erreur: ' + (e.message || e); this.sending = false; }
        });
      },
      error: e => { this.error = 'Erreur: ' + (e.message || e); this.sending = false; }
    });
  }
}
