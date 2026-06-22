export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface Patient {
  id?: number;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  keycloakId?: string;
}

export interface Doctor {
  id?: number;
  nom: string;
  prenom: string;
  specialite: string;
  keycloakId?: string;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Appointment {
  id?: number;
  patientId: number;
  doctorId: number;
  dateHeure: string;          // ISO string
  statut?: AppointmentStatus;
  motif?: string;
}

export interface MedicalNote {
  auteurId?: string;
  contenu: string;
  date?: string;
}

export interface MedicalRecord {
  _id?: string;
  patientId: number;
  antecedents?: string;
  allergies?: string;
  groupeSanguin?: string;
  notes?: MedicalNote[];
}

export interface Medicament {
  nom: string;
  dosage: string;
  duree: string;
}

export interface Prescription {
  _id?: string;
  patientId: number;
  doctorId: number;
  appointmentId?: number;
  medicaments: Medicament[];
  dateCreation?: string;
}
