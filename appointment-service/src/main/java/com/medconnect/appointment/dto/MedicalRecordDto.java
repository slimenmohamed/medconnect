package com.medconnect.appointment.dto;

import lombok.*;

import java.util.List;

/**
 * Représentation locale d'un MedicalRecord venant du service Node.js.
 * Sert UNIQUEMENT à désérialiser la réponse Feign.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedicalRecordDto {
    private String id;
    private Long patientId;
    private String antecedents;
    private String allergies;
    private String groupeSanguin;
    private List<String> notes;
}
