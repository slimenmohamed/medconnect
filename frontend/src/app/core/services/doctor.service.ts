import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Doctor } from '../../models/models';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private base = `${environment.apiBase}/api/doctors`;
  constructor(private http: HttpClient) {}

  list(): Observable<Doctor[]> { return this.http.get<Doctor[]>(this.base); }
  get(id: number):     Observable<Doctor> { return this.http.get<Doctor>(`${this.base}/${id}`); }
  create(d: Doctor):   Observable<Doctor> { return this.http.post<Doctor>(this.base, d); }
  update(id: number, d: Doctor): Observable<Doctor> { return this.http.put<Doctor>(`${this.base}/${id}`, d); }
  delete(id: number):  Observable<void>   { return this.http.delete<void>(`${this.base}/${id}`); }
}
