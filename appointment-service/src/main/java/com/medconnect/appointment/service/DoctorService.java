package com.medconnect.appointment.service;

import com.medconnect.appointment.dto.DoctorDto;
import com.medconnect.appointment.dto.Mapper;
import com.medconnect.appointment.entity.Doctor;
import com.medconnect.appointment.exception.NotFoundException;
import com.medconnect.appointment.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DoctorService {

    private final DoctorRepository repository;

    public List<DoctorDto> findAll() {
        return repository.findAll().stream().map(Mapper::toDto).toList();
    }

    public DoctorDto findById(Long id) {
        return Mapper.toDto(getOrThrow(id));
    }

    public DoctorDto create(DoctorDto dto) {
        Doctor entity = Mapper.toEntity(dto);
        entity.setId(null);
        return Mapper.toDto(repository.save(entity));
    }

    public DoctorDto update(Long id, DoctorDto dto) {
        Doctor existing = getOrThrow(id);
        existing.setNom(dto.getNom());
        existing.setPrenom(dto.getPrenom());
        existing.setSpecialite(dto.getSpecialite());
        if (dto.getKeycloakId() != null) existing.setKeycloakId(dto.getKeycloakId());
        return Mapper.toDto(repository.save(existing));
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) throw new NotFoundException("Doctor id=" + id);
        repository.deleteById(id);
    }

    private Doctor getOrThrow(Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Doctor id=" + id));
    }
}
