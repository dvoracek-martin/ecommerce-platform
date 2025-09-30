package com.dvoracek.translationservice.application.event.listener;

import com.dvoracek.translationservice.application.event.publisher.TranslationEventPublisher;
import com.dvoracek.translationservice.domain.service.TranslationService;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import com.dvoracekmartin.common.event.translation.TranslationGetOrDeleteEvent;
import com.dvoracekmartin.common.event.translation.TranslationSaveEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TranslationEventListener {

    private final TranslationEventPublisher translationEventPublisher;
    private final TranslationService translationService;

    @KafkaListener(
            topics = "${global.kafka.topics.translations.translation-save}",
            groupId = "translation-service-group"
    )
    public void handleTranslationSave(TranslationSaveEvent request) {
        try {
            log.info("Received translation save request with correlationId: {}", request.getCorrelationId());

            switch (request.getObjectType()) {
                case CATEGORY ->
                        translationService.createOrUpdateCategoryTranslation(request.getEntityId(), request.getLocalizedFields());
                case PRODUCT ->
                        translationService.createOrUpdateProductTranslation(request.getEntityId(), request.getLocalizedFields());
                default -> {
                    log.warn("Unknown object type: {}", request.getObjectType());
                    return; // or handle error appropriately
                }
            }

//            translationEventPublisher.sendTranslationResponse(
//                    request.getCorrelationId(),
//                    request.getEntityId() // or whatever ID you need
//            );

        } catch (Exception e) {
            log.error("Error handling translation request:", e);
        }
    }

    @KafkaListener(
            topics = "${global.kafka.topics.translations.translation-request}",
            groupId = "translation-service-group"
    )
    public void handleTranslationRequest(TranslationGetOrDeleteEvent request) {
        try {
//            log.info("Received translation request with correlationId: {}", request.getCorrelationId());
            Map<String, LocalizedField> localizedFieldMap;
            switch (request.getObjectType()) {
                case CATEGORY ->
                        localizedFieldMap = translationService.getTranslationsByCategoryId(request.getEntityId());
//                case PRODUCT ->
//                        translationService.saveProductTranslation(request.getEntityId(), request.getLocalizedFields());
                default -> {
                    log.warn("Unknown object type: {}", request.getObjectType());
                    return; // or handle error appropriately
                }
            }

//            translationEventPublisher.sendTranslationResponse(
////                    request.getCorrelationId(),
//                    localizedFieldMap
//            );

        } catch (Exception e) {
            log.error("Error handling translation request:", e);
        }
    }
}
