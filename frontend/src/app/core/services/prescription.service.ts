import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Prescription } from '../../models/models';

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private base = `${environment.apiBase}/api/prescriptions`;
  constructor(private http: HttpClient) {}

  all(): Observable<Prescription[]> { return this.http.get<Prescription[]>(this.base); }
  byPatient(pid: number): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.base}/patient/${pid}`);
  }
  create(p: Prescription): Observable<Prescription> { return this.http.post<Prescription>(this.base, p); }
}
