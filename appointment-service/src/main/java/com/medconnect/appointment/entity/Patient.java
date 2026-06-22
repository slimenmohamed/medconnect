package com.medconnect.appointment.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "patients")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 80)
    private String nom;

    @NotBlank
    @Column(nullable = false, length = 80)
    private String prenom;

    @Email
    @Column(unique = true, length = 120)
    private String email;

    @Column(length = 20)
    private String telephone;

    // Identifiant Keycloak (sub du JWT) — sert au filtrage "mes données"
    @Column(name = "keycloak_id", length = 64)
    private String keycloakId;
}
