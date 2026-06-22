package com.medconnect.appointment.dto;

import com.medconnect.appointment.entity.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AppointmentDto {
    private Long id;
    @NotNull private Long patientId;
    @NotNull private Long doctorId;
    @NotNull private LocalDateTime dateHeure;
    private AppointmentStatus statut;
    private String motif;
}
