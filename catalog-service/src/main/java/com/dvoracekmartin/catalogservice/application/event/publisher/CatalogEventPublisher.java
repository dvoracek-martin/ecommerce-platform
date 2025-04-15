package com.dvoracekmartin.catalogservice.application.event.publisher;

import com.dvoracekmartin.common.event.UpdateProductStockEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class CatalogEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${global.kafka.topics.inventories.inventory-update}")
    private String inventoryUpdateTopic;
    @Value("${global.kafka.topics.inventories.inventory-request}")
    private String inventoryRequestTopic;

    public CatalogEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishInventoryUpdateTopic(Long productId, Integer stock) {
        UpdateProductStockEvent updateProductStockEvent = new UpdateProductStockEvent(productId, stock);
        log.debug("Publishing event: {}", updateProductStockEvent);
        Mono.fromRunnable(() -> kafkaTemplate.send(inventoryUpdateTopic, updateProductStockEvent))
                .subscribe();
    }

    public void publishInventoryRequestTopic(String requestMessage) {
        Mono.fromRunnable(() -> kafkaTemplate.send(inventoryRequestTopic, requestMessage))
                .subscribe();
    }
}
