package com.medconnect.appointment.messaging;

import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Payload publié sur la queue "appointment.confirmed.q" quand un DOCTOR confirme un RDV.
 * Le service medical-records (Node) le consomme pour créer un MedicalRecord vide si nécessaire.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AppointmentConfirmedEvent implements Serializable {
    private Long appointmentId;
    private Long patientId;
    private Long doctorId;
    private LocalDateTime confirmedAt;
}
