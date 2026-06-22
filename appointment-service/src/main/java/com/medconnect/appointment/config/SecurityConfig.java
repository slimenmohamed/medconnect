package com.medconnect.appointment.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Configuration Spring Security pour appointment-service.
 *
 * - Stateless (JWT only)
 * - Les rôles realm de Keycloak (token.realm_access.roles) sont mappés en
 *   GrantedAuthority "ROLE_PATIENT", "ROLE_DOCTOR", "ROLE_ADMIN"
 * - L'autorisation fine est faite par @PreAuthorize sur les contrôleurs
 *
 * Profil "local" : on désactive l'authentification (tout en permitAll)
 * pour pouvoir tester le CRUD seul sans Keycloak.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    /** Profil docker/prod : sécurité Keycloak active. */
    @Bean
    @Profile("!local")
    public SecurityFilterChain securedFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**", "/v3/api-docs/**", "/swagger-ui/**",
                                 "/swagger-ui.html").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth -> oauth.jwt(jwt ->
                    jwt.jwtAuthenticationConverter(keycloakAuthenticationConverter())
            ));
        return http.build();
    }

    // NB : pas de @Bean ici. Sinon Spring tente d'enregistrer cette lambda
    // dans ApplicationConversionService et plante (types génériques effacés).
    private Converter<Jwt, AbstractAuthenticationToken> keycloakAuthenticationConverter() {
        return jwt -> {
            Collection<GrantedAuthority> authorities = extractRealmRoles(jwt);
            return new JwtAuthenticationToken(jwt, authorities, jwt.getClaimAsString("preferred_username"));
        };
    }

    /** Profil local : tout ouvert pour tests CRUD. */
    @Bean
    @Profile("local")
    public SecurityFilterChain openFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) return List.of();
        Collection<String> roles = (Collection<String>) realmAccess.getOrDefault("roles", List.of());
        return roles.stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                .collect(Collectors.toList());
    }
}
