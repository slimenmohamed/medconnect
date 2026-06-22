package com.medconnect.appointment.controller;

import com.medconnect.appointment.dto.AppointmentDto;
import com.medconnect.appointment.dto.PrescriptionDto;
import com.medconnect.appointment.feign.MedicalRecordsClient;
import com.medconnect.appointment.service.AppointmentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Appointments", description = "Gestion des rendez-vous")
@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService service;
    private final MedicalRecordsClient medicalRecordsClient;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AppointmentDto> all() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public AppointmentDto get(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("isAuthenticated()")
    public List<AppointmentDto> byPatient(@PathVariable Long patientId) {
        return service.findByPatient(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public List<AppointmentDto> byDoctor(@PathVariable Long doctorId) {
        return service.findByDoctor(doctorId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public ResponseEntity<AppointmentDto> create(@Valid @RequestBody AppointmentDto dto) {
        return ResponseEntity.status(201).body(service.create(dto));
    }

    /** Scénario sync + async (a) : Feign + RabbitMQ. */
    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public AppointmentDto confirm(@PathVariable Long id) {
        return service.confirm(id);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public AppointmentDto cancel(@PathVariable Long id) {
        return service.cancel(id);
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public AppointmentDto complete(@PathVariable Long id) {
        return service.complete(id);
    }

    /**
     * Scénario SYNC (b) : récupérer l'historique des prescriptions d'un patient
     * pour les afficher dans le détail d'un rendez-vous.
     * On délègue à medical-records-service via Feign.
     */
    @GetMapping("/patient/{patientId}/prescriptions")
    @PreAuthorize("isAuthenticated()")
    public List<PrescriptionDto> patientPrescriptions(@PathVariable Long patientId) {
        return medicalRecordsClient.getPrescriptionsByPatient(patientId);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
