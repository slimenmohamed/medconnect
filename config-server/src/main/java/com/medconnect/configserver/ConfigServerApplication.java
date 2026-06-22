package com.medconnect.configserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

/**
 * Spring Cloud Config Server - point central de configuration de MedConnect.
 *
 * - Profil "native" : la config est lue depuis le dossier local /config-repo
 *   (monté en volume dans Docker, ou pris depuis le classpath en local).
 * - Les microservices appellent http://config-server:8888/{application}/{profile}
 *   au démarrage pour récupérer leur configuration.
 *
 * Bonus : le service Node.js peut aussi appeler cette URL en HTTP pour
 * récupérer sa config au format JSON (voir configClient.js).
 */
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
