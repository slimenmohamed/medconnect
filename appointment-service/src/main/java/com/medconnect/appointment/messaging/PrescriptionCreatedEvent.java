package com.medconnect.appointment.messaging;

import lombok.*;

import java.io.Serializable;

/**
 * Payload consommé depuis la queue "prescription.created.q".
 * Publié par medical-records-service à chaque création de prescription.
 * Quand on le reçoit, on passe le RDV correspondant à COMPLETED.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PrescriptionCreatedEvent implements Serializable {
    private String prescriptionId;
    private Long appointmentId;
    private Long patientId;
    private Long doctorId;
}
