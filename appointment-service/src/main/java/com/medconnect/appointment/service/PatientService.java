package com.medconnect.appointment.service;

import com.medconnect.appointment.dto.Mapper;
import com.medconnect.appointment.dto.PatientDto;
import com.medconnect.appointment.entity.Patient;
import com.medconnect.appointment.exception.NotFoundException;
import com.medconnect.appointment.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PatientService {

    private final PatientRepository repository;

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

    public void delete(Long id) {
        if (!repository.existsById(id)) throw new NotFoundException("Patient id=" + id);
        repository.deleteById(id);
    }

    private Patient getOrThrow(Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Patient id=" + id));
    }
}
