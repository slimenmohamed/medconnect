package com.medconnect.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * CORS au niveau gateway pour autoriser le frontend Angular.
 *
 * On expose un bean CorsConfigurationSource qui sera consommé par
 * Spring Security WebFlux via .cors(Customizer.withDefaults())
 * (cf. SecurityConfig). C'est l'approche recommandée : sans cela,
 * la chaîne Spring Security rejette les requêtes preflight OPTIONS
 * AVANT que le CorsWebFilter puisse ajouter les headers.
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOriginPatterns(List.of(
                "http://localhost",
                "http://localhost:80",
                "http://localhost:4200",
                "http://127.0.0.1",
                "http://127.0.0.1:4200"
        ));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
        cfg.setAllowCredentials(true);
        cfg.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}
