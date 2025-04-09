package com.dvoracekmartin.catalogservice.domain.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CatalogDomainServiceImpl implements CatalogDomainService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final Map<Long, CompletableFuture<Integer>> pendingRequests = new ConcurrentHashMap<>();

    @Override
    public Integer getProductStockFromInventory(Long productId) {
        CompletableFuture<Integer> future = new CompletableFuture<>();
        pendingRequests.put(productId, future);

        try {
            String requestMessage = objectMapper.writeValueAsString(Map.of("productId", productId));
            kafkaTemplate.send("inventory-request-topic", requestMessage);
            return future.get(); // Wait for the response
        } catch (Exception e) {
            log.error("Error communicating with inventory service:", e);
            return null;
        } finally {
            pendingRequests.remove(productId);
        }
    }

    @KafkaListener(topics = "inventory-response-topic", groupId = "catalog-service")
    public void handleInventoryResponse(String message) {
        try {
            Map<String, Integer> response = objectMapper.readValue(message, Map.class);
            Long productId = Long.parseLong(response.get("productId").toString());
            Integer stock = response.get("stock");

            CompletableFuture<Integer> future = pendingRequests.get(productId);
            if (future != null) {
                future.complete(stock);
            } else {
                log.warn("Received unexpected inventory response for product ID: {}", productId);
            }
        } catch (Exception e) {
            log.error("Error handling inventory response:", e);
        }
    }
}
