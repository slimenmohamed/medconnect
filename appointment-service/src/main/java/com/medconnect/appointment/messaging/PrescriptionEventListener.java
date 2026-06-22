package com.medconnect.appointment.messaging;

import com.medconnect.appointment.entity.Appointment;
import com.medconnect.appointment.entity.AppointmentStatus;
import com.medconnect.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Consommateur RabbitMQ : à chaque événement "prescription.created"
 * publié par medical-records-service, on marque le RDV correspondant
 * comme COMPLETED. C'est le scénario async (b) de l'énoncé.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PrescriptionEventListener {

    private final AppointmentRepository appointmentRepository;

    @RabbitListener(queues = RabbitConfig.PRESCRIPTION_CREATED_QUEUE)
    public void onPrescriptionCreated(PrescriptionCreatedEvent event) {
        log.info("[RabbitMQ] Received prescription.created -> {}", event);
        if (event.getAppointmentId() == null) {
            log.warn("Événement sans appointmentId, ignoré.");
            return;
        }
        appointmentRepository.findById(event.getAppointmentId()).ifPresentOrElse(
                (Appointment appt) -> {
                    appt.setStatut(AppointmentStatus.COMPLETED);
                    appointmentRepository.save(appt);
                    log.info("RDV {} marqué COMPLETED suite à création prescription {}",
                            appt.getId(), event.getPrescriptionId());
                },
                () -> log.warn("RDV {} introuvable, événement ignoré", event.getAppointmentId())
        );
    }
}
