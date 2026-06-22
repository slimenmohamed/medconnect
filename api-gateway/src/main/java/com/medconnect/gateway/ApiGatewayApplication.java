package com.medconnect.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * MedConnect - API Gateway.
 *
 * Responsabilités :
 *  - Point d'entrée unique du frontend Angular vers les microservices
 *  - Routage via Spring Cloud Gateway (lb://NOM-SERVICE résolu par Eureka)
 *  - Validation JWT Keycloak (OAuth2 Resource Server WebFlux)
 *  - CORS pour le frontend
 *  - Agrégation Swagger UI des deux microservices (bonus)
 */
@SpringBootApplication
public class ApiGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
