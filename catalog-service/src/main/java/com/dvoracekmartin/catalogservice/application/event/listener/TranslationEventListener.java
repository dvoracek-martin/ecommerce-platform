package com.dvoracekmartin.catalogservice.application.event.listener;
import com.dvoracekmartin.catalogservice.domain.service.PendingRequestsManager;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import com.dvoracekmartin.common.event.translation.TranslationResponseEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class TranslationEventListener {

    private final PendingRequestsManager pendingRequestsManager;

    @KafkaListener(
            topics = "${global.kafka.topics.translations.translation-response}",
            groupId = "catalog-service-group",
            containerFactory = "kafkaListenerContainerFactory" // Make sure this exists
    )
    public void handleTranslationResponse(TranslationResponseEvent response) {
        try {
            log.info("Received translation response with correlationId: {}", response.getCorrelationId());

            // Use the correlationId (String) to find the future
            CompletableFuture<Map<String, LocalizedField>> future = pendingRequestsManager.getPendingRequest2(response.getCorrelationId());

            if (future != null) {
                future.complete(response.getLocalizedFields());
                pendingRequestsManager.removePendingRequest2(response.getCorrelationId());
                log.info("Completed future for correlationId: {}", response.getCorrelationId());
            } else {
                log.warn("No pending request found for correlationId: {}", response.getCorrelationId());
            }
        } catch (Exception e) {
            log.error("Error handling translation response:", e);
        }
    }
}
