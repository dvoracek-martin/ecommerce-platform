package com.dvoracekmartin.orderservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient translationWebClient(WebClient.Builder builder) {
        return builder
                .baseUrl("http://localhost:8080/api/translations/v1")
                .build();
    }
    @Bean
    public WebClient catalogWebClient(WebClient.Builder builder) {
        return builder
                .baseUrl("http://localhost:8080/api/catalog/v1")
                .build();
    }
}
