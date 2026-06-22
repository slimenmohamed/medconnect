package com.medconnect.appointment.repository;

import com.medconnect.appointment.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByKeycloakId(String keycloakId);
    Optional<Patient> findByEmail(String email);
}
