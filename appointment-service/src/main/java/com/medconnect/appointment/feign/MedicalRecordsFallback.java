package com.medconnect.appointment.feign;

import com.medconnect.appointment.dto.MedicalRecordDto;
import com.medconnect.appointment.dto.PrescriptionDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * Fallback Feign : appelé si le service medical-records est indisponible
 * ou si le circuit-breaker s'ouvre. On retourne un objet "vide" qui sera
 * interprété comme "dossier non trouvé" en amont.
 */
@Slf4j
@Component
public class MedicalRecordsFallback implements MedicalRecordsClient {

    @Override
    public MedicalRecordDto getRecordByPatient(Long patientId) {
        log.warn("[Fallback] medical-records-service indisponible pour patient {}", patientId);
        return null;
    }

    @Override
    public List<PrescriptionDto> getPrescriptionsByPatient(Long patientId) {
        log.warn("[Fallback] medical-records-service indisponible (prescriptions) patient {}", patientId);
        return Collections.emptyList();
    }
}
