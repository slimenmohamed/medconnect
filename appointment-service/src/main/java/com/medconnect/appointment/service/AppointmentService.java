package com.medconnect.appointment.service;

import com.medconnect.appointment.dto.AppointmentDto;
import com.medconnect.appointment.dto.Mapper;
import com.medconnect.appointment.dto.MedicalRecordDto;
import com.medconnect.appointment.entity.Appointment;
import com.medconnect.appointment.entity.AppointmentStatus;
import com.medconnect.appointment.exception.NotFoundException;
import com.medconnect.appointment.feign.MedicalRecordsClient;
import com.medconnect.appointment.messaging.AppointmentConfirmedEvent;
import com.medconnect.appointment.messaging.AppointmentEventPublisher;
import com.medconnect.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AppointmentService {

    private final AppointmentRepository repository;
    private final AppointmentEventPublisher eventPublisher;
    private final MedicalRecordsClient medicalRecordsClient;

    public List<AppointmentDto> findAll() {
        return repository.findAll().stream().map(Mapper::toDto).toList();
    }

    public List<AppointmentDto> findByPatient(Long patientId) {
        return repository.findByPatientId(patientId).stream().map(Mapper::toDto).toList();
    }

    public List<AppointmentDto> findByDoctor(Long doctorId) {
        return repository.findByDoctorId(doctorId).stream().map(Mapper::toDto).toList();
    }

    public AppointmentDto findById(Long id) {
        return Mapper.toDto(getOrThrow(id));
    }

    public AppointmentDto create(AppointmentDto dto) {
        Appointment a = Mapper.toEntity(dto);
        a.setId(null);
        if (a.getStatut() == null) a.setStatut(AppointmentStatus.PENDING);
        return Mapper.toDto(repository.save(a));
    }

    /**
     * Confirmation d'un RDV par un DOCTOR.
     *
     * 1) (SYNC Feign) On vérifie que le dossier médical du patient existe
     *    dans medical-records-service. Si l'appel échoue (fallback null),
     *    on continue quand même (le listener async créera le dossier).
     * 2) On passe le statut à CONFIRMED.
     * 3) (ASYNC RabbitMQ) On publie un événement "appointment.confirmed"
     *    qui sera consommé par medical-records-service pour créer un
     *    MedicalRecord vide si nécessaire.
     */
    public AppointmentDto confirm(Long id) {
        Appointment appt = getOrThrow(id);

        try {
            MedicalRecordDto record = medicalRecordsClient.getRecordByPatient(appt.getPatientId());
            if (record == null) {
                log.info("Patient {} sans dossier médical existant - sera créé via événement async",
                        appt.getPatientId());
            } else {
                log.info("Dossier médical existant pour patient {} (id={})",
                        appt.getPatientId(), record.getId());
            }
        } catch (Exception e) {
            log.warn("Appel Feign vers medical-records-service en erreur : {}", e.getMessage());
        }

        appt.setStatut(AppointmentStatus.CONFIRMED);
        Appointment saved = repository.save(appt);

        eventPublisher.publishConfirmed(AppointmentConfirmedEvent.builder()
                .appointmentId(saved.getId())
                .patientId(saved.getPatientId())
                .doctorId(saved.getDoctorId())
                .confirmedAt(LocalDateTime.now())
                .build());

        return Mapper.toDto(saved);
    }

    public AppointmentDto cancel(Long id) {
        Appointment appt = getOrThrow(id);
        appt.setStatut(AppointmentStatus.CANCELLED);
        return Mapper.toDto(repository.save(appt));
    }

    public AppointmentDto complete(Long id) {
        Appointment appt = getOrThrow(id);
        appt.setStatut(AppointmentStatus.COMPLETED);
        return Mapper.toDto(repository.save(appt));
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) throw new NotFoundException("Appointment id=" + id);
        repository.deleteById(id);
    }

    private Appointment getOrThrow(Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Appointment id=" + id));
    }
}
