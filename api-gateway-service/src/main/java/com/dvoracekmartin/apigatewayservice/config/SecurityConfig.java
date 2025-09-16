package com.dvoracekmartin.apigatewayservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
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

    @Value("${global.controller.path.cart.base}")
    private String cartBasePath;

    @Value("${global.controller.path.orders.base}")
    private String orderBasePath;

    public SecurityConfig(JwtAuthConverter jwtAuthConverter) {
        this.jwtAuthConverter = jwtAuthConverter;
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchange -> exchange
                        // 1. Always permit OPTIONS requests (for CORS preflight)
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 2. Protect admin paths first (most specific role-based rules)
                        .pathMatchers(userBasePath + apiVersion + "/admin/**").hasRole("user_admin")
                        .pathMatchers(catalogBasePath + apiVersion + "/admin/**").hasRole("user_admin")
                        .pathMatchers(customerBasePath + apiVersion + "/admin/**").hasRole("user_admin")
                        .pathMatchers(cartBasePath + apiVersion + "/admin/**").hasRole("user_admin")
                        .pathMatchers(orderBasePath + apiVersion + "/admin/**").hasRole("user_admin")

                        // 3. Permit all GET requests to non-admin paths after admin rules are applied
                        .pathMatchers(HttpMethod.GET, catalogBasePath + apiVersion + "/**").permitAll()
                        .pathMatchers(HttpMethod.GET, userBasePath + apiVersion + "/**").permitAll()
                        .pathMatchers(HttpMethod.GET, customerBasePath + apiVersion + "/**").permitAll()
                        .pathMatchers(HttpMethod.GET, cartBasePath + apiVersion + "/**").permitAll()
                        .pathMatchers(HttpMethod.GET, orderBasePath + apiVersion + "/**").permitAll()


                        // 4. Permit POST requests to non-admin paths in specific cases
                        .pathMatchers(HttpMethod.POST, catalogBasePath + apiVersion + "/mixtures").permitAll()
                        .pathMatchers(HttpMethod.POST, userBasePath + apiVersion + "/create").permitAll()

                        // 5. Any other exchange requires authentication
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter)));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Content-Disposition"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
