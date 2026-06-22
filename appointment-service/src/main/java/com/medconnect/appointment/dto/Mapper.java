package com.medconnect.appointment.dto;

import com.medconnect.appointment.entity.Appointment;
import com.medconnect.appointment.entity.Doctor;
import com.medconnect.appointment.entity.Patient;

/**
 * Mapper manuel léger Entity <-> DTO.
 * (Volontairement sans MapStruct pour garder le projet plus simple à lire.)
 */
public final class Mapper {
    private Mapper() {}

    public static PatientDto toDto(Patient p) {
        return PatientDto.builder()
                .id(p.getId())
                .nom(p.getNom()).prenom(p.getPrenom())
                .email(p.getEmail()).telephone(p.getTelephone())
                .keycloakId(p.getKeycloakId())
                .build();
    }

    public static Patient toEntity(PatientDto d) {
        return Patient.builder()
                .id(d.getId())
                .nom(d.getNom()).prenom(d.getPrenom())
                .email(d.getEmail()).telephone(d.getTelephone())
                .keycloakId(d.getKeycloakId())
                .build();
    }

    public static DoctorDto toDto(Doctor d) {
        return DoctorDto.builder()
                .id(d.getId()).nom(d.getNom()).prenom(d.getPrenom())
                .specialite(d.getSpecialite()).keycloakId(d.getKeycloakId())
                .build();
    }

    public static Doctor toEntity(DoctorDto d) {
        return Doctor.builder()
                .id(d.getId()).nom(d.getNom()).prenom(d.getPrenom())
                .specialite(d.getSpecialite()).keycloakId(d.getKeycloakId())
                .build();
    }

    public static AppointmentDto toDto(Appointment a) {
        return AppointmentDto.builder()
                .id(a.getId()).patientId(a.getPatientId()).doctorId(a.getDoctorId())
                .dateHeure(a.getDateHeure()).statut(a.getStatut()).motif(a.getMotif())
                .build();
    }

    public static Appointment toEntity(AppointmentDto d) {
        return Appointment.builder()
                .id(d.getId()).patientId(d.getPatientId()).doctorId(d.getDoctorId())
                .dateHeure(d.getDateHeure()).statut(d.getStatut()).motif(d.getMotif())
                .build();
    }
}
