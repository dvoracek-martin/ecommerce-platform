package com.dvoracekmartin.userservice.application.event.publisher;

import com.dvoracekmartin.common.event.CreateUserEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Component
@Slf4j
public class UserEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${global.kafka.topics.users.user-created}")
    private String userCreatedTopic;

    public UserEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishUserCreatedEvent(String userId, String username, String email, String preferredLanguage, boolean active) {
        CreateUserEvent event = new CreateUserEvent(
                userId,
                username,
                email,
                Instant.now(),
                preferredLanguage,
                active
        );

        log.debug("Publishing event: {}", event);
        Mono.fromRunnable(() -> kafkaTemplate.send(userCreatedTopic, userId, event))
                .subscribe();
    }
}
