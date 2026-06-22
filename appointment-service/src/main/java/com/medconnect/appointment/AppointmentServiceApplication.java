package com.medconnect.appointment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * MedConnect - appointment-service.
 *
 * Responsabilités :
 *  - CRUD patients / médecins / rendez-vous (JPA + MySQL ou H2)
 *  - Sécurité OAuth2 Resource Server (JWT Keycloak)
 *  - Communication SYNC via Feign vers medical-records-service
 *  - Communication ASYNC via RabbitMQ (publish "appointment.confirmed",
 *    consume "prescription.created")
 *  - Documentation OpenAPI / Swagger sur /swagger-ui.html
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class AppointmentServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AppointmentServiceApplication.class, args);
    }
}
