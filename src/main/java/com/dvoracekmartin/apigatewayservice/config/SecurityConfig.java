package com.dvoracekmartin.apigatewayservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    private final JwtAuthConverter jwtAuthConverter;

    @Value("${global.controller.current-version}")
    private String apiVersion;

    @Value("${global.controller.path.users.base}")
    private String userBasePath;

    @Value("${global.controller.path.catalog.base}")
    private String catalogBasePath;

    @Value("${global.controller.path.customers.base}")
    private String customerBasePath;

    public SecurityConfig(JwtAuthConverter jwtAuthConverter) {
        this.jwtAuthConverter = jwtAuthConverter;
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchange -> exchange
                                .pathMatchers(userBasePath + apiVersion + "/admin").hasRole("client_admin")
                                .anyExchange().permitAll()
                        // FIXME
                        // .pathMatchers(catalogBasePath + apiVersion + "/all-products").permitAll()
// .pathMatchers(catalogBasePath + apiVersion + "/all-mixtures").permitAll()
// .pathMatchers(catalogBasePath + apiVersion + "/all-categories").permitAll()
// // Users endpoints
// .pathMatchers(HttpMethod.OPTIONS, userBasePath + apiVersion + "/create").permitAll()
// .pathMatchers(HttpMethod.OPTIONS, userBasePath + apiVersion + "/password").permitAll()
// .pathMatchers(HttpMethod.OPTIONS, userBasePath + apiVersion + "/update-user").permitAll()
// .pathMatchers(HttpMethod.OPTIONS, userBasePath + apiVersion + "/*/password").permitAll()
// .pathMatchers(HttpMethod.OPTIONS, userBasePath + apiVersion + "/forgot-password").permitAll()
// .pathMatchers(HttpMethod.POST, userBasePath + apiVersion + "/create").permitAll()
// .pathMatchers(HttpMethod.POST, userBasePath + apiVersion + "/password").permitAll()
// .pathMatchers(HttpMethod.PUT, userBasePath + apiVersion + "/update-user").permitAll()
// .pathMatchers(HttpMethod.PUT, userBasePath + apiVersion + "/*/password").permitAll()
// .pathMatchers(HttpMethod.POST, userBasePath + apiVersion + "/forgot-password").permitAll()
// // Customers Endpoints
// .pathMatchers(HttpMethod.OPTIONS, customerBasePath + apiVersion + "/**").authenticated()
// .pathMatchers(HttpMethod.GET, customerBasePath + apiVersion + "/**").authenticated()
// .pathMatchers(HttpMethod.POST, customerBasePath + apiVersion + "/**").authenticated()
// .pathMatchers(HttpMethod.PUT, customerBasePath + apiVersion + "/**").authenticated()

                        // All other endpoints require authentication
//                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter))
                ).build();
    }

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(Arrays.asList("http://localhost:4200")); // Added localhost:8080
        config.setAllowedHeaders(Arrays.asList("Origin", "Access-Control-Allow-Origin", "Content-Type",
                "Accept", "Authorization", "Origin, Accept", "X-Requested-With",
                "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
        config.setExposedHeaders(Arrays.asList("Origin", "Content-Type", "Accept", "Authorization",
                "Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}
