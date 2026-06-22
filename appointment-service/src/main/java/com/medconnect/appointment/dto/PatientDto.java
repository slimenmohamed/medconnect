package com.medconnect.appointment.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PatientDto {
    private Long id;
    @NotBlank private String nom;
    @NotBlank private String prenom;
    @Email    private String email;
    private String telephone;
    private String keycloakId;
}
