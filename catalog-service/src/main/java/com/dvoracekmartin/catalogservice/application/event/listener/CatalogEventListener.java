package com.dvoracekmartin.catalogservice.application.event.listener;

import com.dvoracekmartin.catalogservice.domain.service.PendingRequestsManager;
import com.dvoracekmartin.common.event.ResponseProductStockEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class CatalogEventListener {

    private final PendingRequestsManager pendingRequestsManager;

    @KafkaListener(topics = "${global.kafka.topics.inventories.inventory-response}", groupId = "catalog-service-group")
    public void handleInventoryResponse(ResponseProductStockEvent responseProductStockEvent) {
        try {
            CompletableFuture<Integer> future = pendingRequestsManager.getPendingRequest(responseProductStockEvent.productId());
            if (future != null) {
                future.complete(responseProductStockEvent.stock());
            } else {
                log.warn("Received unexpected inventory response for product ID: {}", responseProductStockEvent.productId());
            }
        } catch (Exception e) {
            log.error("Error handling inventory response:", e);
        }
    }
}
