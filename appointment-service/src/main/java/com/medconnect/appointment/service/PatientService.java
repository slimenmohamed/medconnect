package com.medconnect.appointment.service;

import com.medconnect.appointment.dto.Mapper;
import com.medconnect.appointment.dto.PatientDto;
import com.medconnect.appointment.entity.Patient;
import com.medconnect.appointment.exception.NotFoundException;
import com.medconnect.appointment.feign.MedicalRecordsClient;
import com.medconnect.appointment.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PatientService {

    private final PatientRepository repository;
    private final MedicalRecordsClient medicalRecordsClient;

    public List<PatientDto> findAll() {
        return repository.findAll().stream().map(Mapper::toDto).toList();
    }

    public PatientDto findById(Long id) {
        return Mapper.toDto(getOrThrow(id));
    }

    public PatientDto findByKeycloakId(String kcId) {
        return repository.findByKeycloakId(kcId)
                .map(Mapper::toDto)
                .orElseThrow(() -> new NotFoundException("Patient keycloakId=" + kcId));
    }

    public PatientDto create(PatientDto dto) {
        Patient entity = Mapper.toEntity(dto);
        entity.setId(null);
        return Mapper.toDto(repository.save(entity));
    }

    public PatientDto update(Long id, PatientDto dto) {
        Patient existing = getOrThrow(id);
        existing.setNom(dto.getNom());
        existing.setPrenom(dto.getPrenom());
        existing.setEmail(dto.getEmail());
        existing.setTelephone(dto.getTelephone());
        if (dto.getKeycloakId() != null) existing.setKeycloakId(dto.getKeycloakId());
        return Mapper.toDto(repository.save(existing));
    }

    /**
     * Suppression d'un patient :
     *  1) On supprime le patient + ses RDV en MySQL (cascade JPA).
     *  2) SCENARIO SYNC #3 : on appelle medical-records-service via Feign
     *     pour purger SYNCHRONEMENT son dossier médical + prescriptions (Mongo).
     *     => Garantit la cohérence cross-database.
     *     En cas d'indisponibilité du service Node, le fallback Resilience4j prend
     *     le relais et logge l'incident (les données seront purgées via un cron de
     *     réconciliation — non implémenté ici).
     */
    public void delete(Long id) {
        if (!repository.existsById(id)) throw new NotFoundException("Patient id=" + id);
        repository.deleteById(id);
        try {
            Map<String, Object> purgeResult = medicalRecordsClient.purgePatientData(id);
            log.info("[Feign SYNC #3] Purge dossier patient {} -> {}", id, purgeResult);
        } catch (Exception e) {
            log.warn("[Feign SYNC #3] Echec purge dossier patient {} : {}", id, e.getMessage());
        }
    }

    private Patient getOrThrow(Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Patient id=" + id));
    }
}
