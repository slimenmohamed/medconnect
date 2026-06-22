package com.medconnect.appointment.repository;

import com.medconnect.appointment.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByKeycloakId(String keycloakId);
}
