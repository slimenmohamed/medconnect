package com.medconnect.appointment.messaging;

import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Payload publié sur la queue "appointment.cancelled.q" quand un PATIENT ou un ADMIN
 * annule un rendez-vous. Consommé par medical-records-service (Node.js) qui ajoute
 * automatiquement une note dans le dossier médical du patient pour traçabilité.
 *
 * Scénario ASYNC #3 du projet.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AppointmentCancelledEvent implements Serializable {
    private Long appointmentId;
    private Long patientId;
    private Long doctorId;
    private String reason;
    private LocalDateTime cancelledAt;
}
