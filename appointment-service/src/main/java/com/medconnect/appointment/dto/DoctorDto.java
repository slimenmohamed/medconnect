package com.medconnect.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DoctorDto {
    private Long id;
    @NotBlank private String nom;
    @NotBlank private String prenom;
    @NotBlank private String specialite;
    private String keycloakId;
}
