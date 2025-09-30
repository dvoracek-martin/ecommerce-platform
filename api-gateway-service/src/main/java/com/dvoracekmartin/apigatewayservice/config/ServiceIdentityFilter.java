package com.dvoracekmartin.apigatewayservice.config;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class ServiceIdentityFilter implements GlobalFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String targetUri = exchange.getRequest().getURI().getPath();

        if (targetUri.startsWith("/api/translations/")) {
            exchange = exchange.mutate()
                    .request(r -> r.headers(h -> h.add("X-Service-Caller", "CATALOG-SERVICE")))
                    .build();
        }

        return chain.filter(exchange);
    }
}
