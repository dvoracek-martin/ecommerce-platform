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
                .csrf(AbstractHttpConfigurer::disable)
                .cors(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers(
                                "/api/catalog/v1/all-products",
                                "/api/catalog/v1/products/{id}",
                                "/api/catalog/v1/all-products-and-mixtures",
                                "/api/catalog/v1/all-categories",
                                "/api/catalog/v1/all-mixtures",
                                "/api/catalog/v1/all-products-by-category-id/{categoryId}",
                                "/api/catalog/v1/active-products-by-category-id/{categoryId}",
                                "/api/catalog/v1/search",
                                "/api/catalog/v1/active-categories",
                                "/api/catalog/v1/all-mixtures/{id}",
                                "/api/catalog/v1/mixtures",
                                "/api/catalog/v1/mixtures/{id}"
                        ).permitAll()
                        // Everything else JWT
                        .anyRequest().authenticated()
                )
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.decoder(jwtDecoder())));

        return http.build();
    }
}
