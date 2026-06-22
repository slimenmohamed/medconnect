import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MedicalRecord } from '../../models/models';

@Injectable({ providedIn: 'root' })
export class RecordService {
  private base = `${environment.apiBase}/api/records`;
  constructor(private http: HttpClient) {}

  all():           Observable<MedicalRecord[]> { return this.http.get<MedicalRecord[]>(this.base); }
  byPatient(pid: number): Observable<MedicalRecord> {
    return this.http.get<MedicalRecord>(`${this.base}/patient/${pid}`);
  }
  create(r: MedicalRecord): Observable<MedicalRecord> { return this.http.post<MedicalRecord>(this.base, r); }
  addNote(id: string, contenu: string): Observable<MedicalRecord> {
    return this.http.post<MedicalRecord>(`${this.base}/${id}/notes`, { contenu });
  }
}
