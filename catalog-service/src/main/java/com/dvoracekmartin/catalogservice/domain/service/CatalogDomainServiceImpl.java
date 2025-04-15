package com.dvoracekmartin.catalogservice.domain.service;

import com.dvoracekmartin.catalogservice.application.event.publisher.CatalogEventPublisher;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CatalogDomainServiceImpl implements CatalogDomainService {

    private final CatalogEventPublisher catalogEventPublisher;
    private final ObjectMapper objectMapper;
    private final PendingRequestsManager pendingRequestsManager;

    @Override
    public Integer getProductStockFromInventory(Long productId) {
        CompletableFuture<Integer> future = new CompletableFuture<>();
        pendingRequestsManager.addPendingRequest(productId, future);

        try {
            String requestMessage = objectMapper.writeValueAsString(Map.of("productId", productId));
            catalogEventPublisher.publishInventoryRequestTopic(requestMessage);
            return future.get(10, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Error communicating with inventory service:", e);
            return null;
        } finally {
            pendingRequestsManager.removePendingRequest(productId);
        }
    }
}
