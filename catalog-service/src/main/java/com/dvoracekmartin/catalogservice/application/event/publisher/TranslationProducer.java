package com.dvoracekmartin.catalogservice.application.event.publisher;
import com.dvoracekmartin.common.event.translation.TranslationGetOrDeleteEvent;
import com.dvoracekmartin.common.event.translation.TranslationSaveEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class TranslationProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${global.kafka.topics.translations.translation-save}")
    private String translationSaveTopic;

    @Value("${global.kafka.topics.translations.translation-request}")
    private String translationRequestTopic;

    public void publishTranslationSave(TranslationSaveEvent requestEvent) {
        try {
            log.info("Sending translation request with correlationId: {}", requestEvent.getCorrelationId());
            kafkaTemplate.send(translationSaveTopic, requestEvent.getCorrelationId(), requestEvent);
        } catch (Exception e) {
            log.error("Error sending translation request:", e);
            throw new RuntimeException("Failed to send translation request", e);
        }
    }

    public void publishTranslationRequest(TranslationGetOrDeleteEvent requestEvent) {
        try {
//            log.info("Sending translation request with correlationId: {}", requestEvent.getCorrelationId());
//            kafkaTemplate.send(translationRequestTopic, requestEvent.getCorrelationId(), requestEvent);
        } catch (Exception e) {
            log.error("Error sending translation request:", e);
            throw new RuntimeException("Failed to send translation request", e);
        }
    }
}
