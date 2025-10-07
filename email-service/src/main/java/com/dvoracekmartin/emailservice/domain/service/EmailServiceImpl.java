package com.dvoracekmartin.emailservice.domain.service;

import com.dvoracekmartin.common.dto.email.EmailDTO;
import com.dvoracekmartin.common.dto.email.EmailSendDTO;
import com.dvoracekmartin.common.event.email.EmailObjectsEnum;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import com.dvoracekmartin.common.event.translation.TranslationGetOrDeleteEvent;
import com.dvoracekmartin.common.event.translation.TranslationObjectsEnum;
import com.dvoracekmartin.common.event.translation.TranslationSaveEvent;
import com.dvoracekmartin.emailservice.application.dto.ResponseEmailDTO;
import com.dvoracekmartin.emailservice.application.dto.ResponseEmailLogDTO;
import com.dvoracekmartin.emailservice.application.utils.EmailLogMapper;
import com.dvoracekmartin.emailservice.domain.model.Email;
import com.dvoracekmartin.emailservice.domain.model.EmailLog;
import com.dvoracekmartin.emailservice.domain.repository.EmailLogRepository;
import com.dvoracekmartin.emailservice.domain.repository.EmailRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.AllArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@AllArgsConstructor
@Transactional
public class EmailServiceImpl implements EmailService {

    private final EmailRepository emailRepository;
    private final EmailLogRepository emailLogRepository;
    private final WebClient translationWebClient;
    private final JavaMailSender mailSender;
    private final EmailLogMapper emailLogMapper;

    private static TranslationSaveEvent createRequestForTranslationSave(Long elementId, TranslationObjectsEnum elementType, Map<String, LocalizedField> localizedFieldMap) {
        return new TranslationSaveEvent(
                UUID.randomUUID().toString(),
                elementType,
                elementId,
                localizedFieldMap
        );
    }

    private static TranslationGetOrDeleteEvent createRequestForTranslationGetOrDelete(Long elementId, TranslationObjectsEnum elementType) {
        return new TranslationGetOrDeleteEvent(
                elementType,
                elementId
        );
    }

    private void saveOrUpdateTranslation(TranslationSaveEvent translationSaveEvent) {
        translationWebClient.post()
                .uri("/save")
                .bodyValue(translationSaveEvent)
                .retrieve()
                .bodyToMono(Void.class)
                .block();
    }

    private Map<String, LocalizedField> getTranslationMap(TranslationGetOrDeleteEvent translationGetOrDeleteEvent) {
        return translationWebClient.post()
                .uri("/get")
                .bodyValue(translationGetOrDeleteEvent)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, LocalizedField>>() {
                })
                .block();
    }

    private Map<String, LocalizedField> deleteTranslationMap(TranslationGetOrDeleteEvent translationGetOrDeleteEvent) {
        return translationWebClient.post()
                .uri("/delete")
                .bodyValue(translationGetOrDeleteEvent)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, LocalizedField>>() {
                })
                .block();
    }

    @Override
    public void createOrUpdateEmail(EmailDTO emailDTO) {
        Email email = emailRepository.getEmailByEmailType(emailDTO.getEmailType()).orElseThrow(() -> new RuntimeException("Email not found with email type: " + emailDTO.getEmailType()));
        saveOrUpdateTranslation(createRequestForTranslationSave(email.getId(), TranslationObjectsEnum.EMAIL_TEMPLATE, emailDTO.getLocalizedFields()));
    }


    @Override
    public ResponseEmailDTO getTranslatedEmailByType(EmailObjectsEnum emailType) {
        Email email = emailRepository.getEmailByEmailType(emailType.name()).orElseThrow(() -> new RuntimeException("Email not found with email type: " + emailType));
        Map<String, LocalizedField> localizedFieldMap = getTranslationMap(createRequestForTranslationGetOrDelete(email.getId(), TranslationObjectsEnum.EMAIL_TEMPLATE));
        return new ResponseEmailDTO(email.getId(), email.getEmailType(), localizedFieldMap);
    }

    @Override
    public List<ResponseEmailLogDTO> getResponseEmailLogEntries() {
        return emailLogRepository.findAll().stream()
                .sorted((e1, e2) -> e2.getSentAt().compareTo(e1.getSentAt()))
                .map(emailLogMapper::mapEmailLogToResponseEmailLogDTO)
                .toList();
    }

    @Override
    public void sendEmail(EmailSendDTO emailSendDTO) {
        emailSendDTO.getRecipients().forEach(recipient -> {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true);
                helper.setSubject(emailSendDTO.getSubject());
                helper.setText(emailSendDTO.getBody(), true);
                helper.addTo(recipient);

                mailSender.send(message);
                emailLogRepository.save(new EmailLog(null, emailSendDTO.getEmailType(), recipient, LocalDateTime.now(), emailSendDTO.getBody(), emailSendDTO.getSubject(), emailSendDTO.getLanguage()));
            } catch (Exception e) {
                throw new RuntimeException("Failed to send email", e);
            }
        });
    }

    // TODO delete maybe not even necessary?
}
