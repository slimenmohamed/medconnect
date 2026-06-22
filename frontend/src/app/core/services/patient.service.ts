import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Patient } from '../../models/models';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private base = `${environment.apiBase}/api/patients`;
  constructor(private http: HttpClient) {}

  list():       Observable<Patient[]> { return this.http.get<Patient[]>(this.base); }
  me():         Observable<Patient>   { return this.http.get<Patient>(`${this.base}/me`); }
  get(id: number):      Observable<Patient> { return this.http.get<Patient>(`${this.base}/${id}`); }
  create(p: Patient):   Observable<Patient> { return this.http.post<Patient>(this.base, p); }
  update(id: number, p: Patient): Observable<Patient> { return this.http.put<Patient>(`${this.base}/${id}`, p); }
  delete(id: number):   Observable<void>    { return this.http.delete<void>(`${this.base}/${id}`); }
}
