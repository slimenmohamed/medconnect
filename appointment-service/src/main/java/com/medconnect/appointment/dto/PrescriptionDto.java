package com.medconnect.appointment.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PrescriptionDto {
    private String id;
    private Long patientId;
    private Long doctorId;
    private Long appointmentId;
    private List<Map<String, String>> medicaments;
    private LocalDateTime dateCreation;
}
