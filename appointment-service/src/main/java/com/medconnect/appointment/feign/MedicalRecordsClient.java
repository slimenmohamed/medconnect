package com.medconnect.appointment.feign;

import com.medconnect.appointment.dto.MedicalRecordDto;
import com.medconnect.appointment.dto.PrescriptionDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Communication SYNCHRONE Feign vers medical-records-service (Node.js).
 *
 * Le nom logique "medical-records-service" est résolu via Eureka.
 * En cas d'erreur (service down, 5xx), le fallback MedicalRecordsFallback est utilisé
 * grâce au CircuitBreaker Resilience4j (configuration "medicalRecordsCB").
 *
 * Scénarios couverts :
 *  1) getRecordByPatient(patientId) : vérifier qu'un dossier médical existe avant de confirmer un RDV
 *  2) getPrescriptionsByPatient(patientId) : récupérer l'historique des prescriptions
 *     pour l'afficher dans le détail d'un rendez-vous
 */
@FeignClient(
        name = "${medconnect.feign.medical-records-service-name:medical-records-service}",
        fallback = MedicalRecordsFallback.class
)
public interface MedicalRecordsClient {

    @GetMapping("/api/records/patient/{patientId}")
    MedicalRecordDto getRecordByPatient(@PathVariable("patientId") Long patientId);

    @GetMapping("/api/prescriptions/patient/{patientId}")
    List<PrescriptionDto> getPrescriptionsByPatient(@PathVariable("patientId") Long patientId);
}
