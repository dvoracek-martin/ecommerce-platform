package com.dvoracek.translationservice.application.event.publisher;

import com.dvoracekmartin.common.event.translation.LocalizedField;
import com.dvoracekmartin.common.event.translation.TranslationResponseEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class TranslationEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${global.kafka.topics.translations.translation-response}")
    private String translationResponseTopic;
//
//    public void sendTranslationResponse(String correlationId, Long categoryId) {
//        try {
//            TranslationResponseEvent response = new TranslationResponseEvent(
//                    correlationId,
//                    categoryId,
//                    Map.of() // Your translation data
//            );

//            log.info("Sending translation response for correlationId: {}", correlationId);

//            kafkaTemplate.send(translationResponseTopic, correlationId, response)
//                 ;
//
//        } catch (Exception e) {
//            log.error("Error sending translation response:", e);
//        }
//    }

    public void sendTranslationResponse(String correlationId, Map<String, LocalizedField> localizedFieldMap) {
        try {
            TranslationResponseEvent response = new TranslationResponseEvent(
                    correlationId,
                    localizedFieldMap
            );

            log.info("Sending translation response for correlationId: {}", correlationId);

            kafkaTemplate.send(translationResponseTopic, correlationId, response);

        } catch (Exception e) {
            log.error("Error sending translation response:", e);
        }
    }
}
