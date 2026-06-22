import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment, Prescription } from '../../models/models';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private base = `${environment.apiBase}/api/appointments`;
  constructor(private http: HttpClient) {}

  all():       Observable<Appointment[]> { return this.http.get<Appointment[]>(this.base); }
  byPatient(patientId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.base}/patient/${patientId}`);
  }
  byDoctor(doctorId: number):  Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.base}/doctor/${doctorId}`);
  }
  patientPrescriptions(patientId: number): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.base}/patient/${patientId}/prescriptions`);
  }

  create(a: Appointment): Observable<Appointment> { return this.http.post<Appointment>(this.base, a); }
  confirm(id: number):    Observable<Appointment> { return this.http.post<Appointment>(`${this.base}/${id}/confirm`, {}); }
  cancel(id: number):     Observable<Appointment> { return this.http.post<Appointment>(`${this.base}/${id}/cancel`, {}); }
  complete(id: number):   Observable<Appointment> { return this.http.post<Appointment>(`${this.base}/${id}/complete`, {}); }
  delete(id: number):     Observable<void>        { return this.http.delete<void>(`${this.base}/${id}`); }
}
