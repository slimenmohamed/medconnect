package com.medconnect.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * Sécurité du gateway (WebFlux, donc Server*).
 *
 * - Profil "!local" : valide tous les JWT Keycloak ; les endpoints publics
 *   (swagger, /actuator/health, /aggregate/**) restent ouverts pour permettre
 *   au frontend d'agréger les docs sans token.
 * - Profil "local" : tout ouvert pour faciliter les tests du routing.
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    @Profile("!local")
    public SecurityWebFilterChain securedFilterChain(ServerHttpSecurity http) {
        http
            // Active CORS et délègue la conf au bean CorsConfigurationSource.
            // Sans cela, Spring Security rejette les preflight OPTIONS avec 401.
            .cors(Customizer.withDefaults())
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .authorizeExchange(ex -> ex
                // Toujours laisser passer les preflight OPTIONS
                .pathMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .pathMatchers(
                    "/actuator/**",
                    "/v3/api-docs/**",
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/webjars/**",
                    "/aggregate/**"
                ).permitAll()
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(o -> o.jwt(jwt -> {}));
        return http.build();
    }

    @Bean
    @Profile("local")
    public SecurityWebFilterChain openFilterChain(ServerHttpSecurity http) {
        http
            .cors(Customizer.withDefaults())
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .authorizeExchange(ex -> ex.anyExchange().permitAll());
        return http.build();
    }
}
