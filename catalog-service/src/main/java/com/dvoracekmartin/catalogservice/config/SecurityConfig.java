package com.dvoracekmartin.catalogservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}")
    private String jwkSetUri;

    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF for stateless APIs
                .csrf(AbstractHttpConfigurer::disable)

                // Disable CORS (handled by Gateway)
                .cors(AbstractHttpConfigurer::disable)

                // Authorization rules
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints (no auth required)
                        .requestMatchers(
                                "/api/catalog/v1/all-products",
                                "/api/catalog/v1/products/{id}",
                                "/api/catalog/v1/all-products-and-mixtures",
                                "/api/catalog/v1/all-categories",
                                "/api/catalog/v1/all-mixtures",
                                "all-products-by-category-id/{categoryId}",
                                "/api/catalog/v1/search",
                                "/api/catalog/v1/active-categories",
                                "/api/catalog/v1/all-mixtures",
                                "/api/catalog/v1/all-mixtures/{id}",
                                "/api/catalog/v1/mixtures"
                        ).permitAll()

                        // All other endpoints require authentication (roles enforced at Gateway)
                        .anyRequest().authenticated()
                )

                // Stateless session
                .sessionManagement(sm -> sm
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // JWT validation (trusts Gateway's auth decisions)
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.decoder(jwtDecoder()))
                );

        return http.build();
    }
}
