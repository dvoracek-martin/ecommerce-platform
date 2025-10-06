package com.dvoracekmartin.emailservice.application.event.listener;

import com.dvoracekmartin.common.event.email.EmailSendEvent;
import com.dvoracekmartin.emailservice.domain.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailEventListener {

    private final EmailService emailService;

    @KafkaListener(
            topics = "${global.kafka.topics.emails.email-send}",
            groupId = "email-service-group"
    )
    public void handleEmailSend(EmailSendEvent request) {
        try {
            log.info("Received email save request with correlationId: {}", request.getCorrelationId());
            emailService.sendEmail(request.getEmailDTO());
        } catch (Exception e) {
            log.error("Error handling email request:", e);
        }
    }
}
