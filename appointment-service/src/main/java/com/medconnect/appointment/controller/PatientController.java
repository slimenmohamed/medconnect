package com.medconnect.appointment.controller;

import com.medconnect.appointment.dto.PatientDto;
import com.medconnect.appointment.service.PatientService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Patients", description = "Gestion des patients")
@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public List<PatientDto> all() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public PatientDto get(@PathVariable Long id) {
        return service.findById(id);
    }

    /** Récupère le patient correspondant au JWT courant (utilisé par le frontend). */
    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public PatientDto me(@RequestHeader("Authorization") String auth,
                        org.springframework.security.core.Authentication authentication) {
        String kcId = ((org.springframework.security.oauth2.jwt.Jwt)
                authentication.getPrincipal()).getSubject();
        return service.findByKeycloakId(kcId);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PatientDto> create(@Valid @RequestBody PatientDto dto) {
        return ResponseEntity.status(201).body(service.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public PatientDto update(@PathVariable Long id, @Valid @RequestBody PatientDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
