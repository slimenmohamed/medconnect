package com.medconnect.discovery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/**
 * Eureka Server - registre des services MedConnect.
 *
 * Tous les microservices Java (appointment-service, api-gateway) et le service
 * Node.js (medical-records-service via eureka-js-client) s'enregistrent ici.
 *
 * Dashboard : http://localhost:8761
 */
@SpringBootApplication
@EnableEurekaServer
public class DiscoveryServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(DiscoveryServerApplication.class, args);
    }
}
