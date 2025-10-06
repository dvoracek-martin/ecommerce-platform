package com.dvoracekmartin.emailservice.v1;

import com.dvoracekmartin.common.dto.email.EmailDTO;
import com.dvoracekmartin.emailservice.application.dto.EmailGetOrDeleteEvent;
import com.dvoracekmartin.emailservice.application.dto.ResponseEmailDTO;
import com.dvoracekmartin.emailservice.application.dto.ResponseEmailLogDTO;
import com.dvoracekmartin.emailservice.domain.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emails/v1")
@Validated
@RequiredArgsConstructor
@Slf4j
public class EmailControllerV1 {

    private final EmailService emailService;

    @PostMapping("/get")
    public ResponseEntity<ResponseEmailDTO> getEmail(@RequestBody EmailGetOrDeleteEvent request) {
        return ResponseEntity.ok(emailService.getTranslatedEmailByType(request.getObjectType()));
    }

    @GetMapping
    public ResponseEntity<List<ResponseEmailLogDTO>> getAllEmailLogs() {
        return ResponseEntity.ok(emailService.getResponseEmailLogEntries());
    }

    @PostMapping("/save")
    public void createOrUpdateEmail(@RequestBody EmailDTO emailDTO) {
        emailService.createOrUpdateEmail(emailDTO);
    }


//    @PostMapping("/delete")
//    public void deleteTranslation(@RequestBody EmailGetOrDeleteEvent request) {
//        log.info("Received translation request: {}", request);
//        if (request.getObjectType() == EmailObjectsEnum.REGISTRATION) {
//            emailService.getTranslationsByCategoryId(request.getEntityId());
//        } else if (request.getObjectType() == EmailObjectsEnum.PASSWORD_RESET) {
//            emailService.getTranslationsByProductId(request.getEntityId());
//        } else {
//            log.warn("Unknown object type: {}", request.getObjectType());
//        }
//    }
}
