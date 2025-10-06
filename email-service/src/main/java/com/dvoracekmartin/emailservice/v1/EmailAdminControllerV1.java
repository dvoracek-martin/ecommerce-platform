package com.dvoracekmartin.emailservice.v1;

import com.dvoracekmartin.common.dto.email.EmailDTO;
import com.dvoracekmartin.common.dto.email.EmailSendDTO;
import com.dvoracekmartin.emailservice.application.dto.EmailGetOrDeleteEvent;
import com.dvoracekmartin.emailservice.application.dto.ResponseEmailDTO;
import com.dvoracekmartin.emailservice.application.dto.ResponseEmailLogDTO;
import com.dvoracekmartin.emailservice.domain.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emails/v1/admin")
@PreAuthorize("hasRole('user_admin')")
@Validated
@RequiredArgsConstructor
@Slf4j
public class EmailAdminControllerV1 {

    private final EmailService emailService;


    @PostMapping("/save")
    public void createOrUpdateEmail(@RequestBody EmailDTO emailDTO) {
        emailService.createOrUpdateEmail(emailDTO);
    }

    @PostMapping("/send")
    public ResponseEntity<Void> sendEmail(@RequestBody EmailSendDTO emailSendDTO) {
        log.info("Received email send request for {} recipients, type: {}, language: {}",
                emailSendDTO.getRecipients().size(), emailSendDTO.getEmailType(), emailSendDTO.getLanguage());

        try {
            emailService.sendEmail(emailSendDTO);
            log.info("Successfully sent email to {} recipients", emailSendDTO.getRecipients().size());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to send email to {} recipients: {}", emailSendDTO.getRecipients().size(), e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }


    @PostMapping("/get")
    public ResponseEntity<ResponseEmailDTO> getEmail(@RequestBody EmailGetOrDeleteEvent request) {
        return ResponseEntity.ok(emailService.getTranslatedEmailByType(request.getObjectType()));
    }

    @GetMapping
    public ResponseEntity<List<ResponseEmailLogDTO>> getAllEmailLogs() {
        return ResponseEntity.ok(emailService.getResponseEmailLogEntries());
    }
}
