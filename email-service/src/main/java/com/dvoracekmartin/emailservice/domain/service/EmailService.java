package com.dvoracekmartin.emailservice.domain.service;

import com.dvoracekmartin.common.dto.email.EmailDTO;
import com.dvoracekmartin.common.dto.email.EmailSendDTO;
import com.dvoracekmartin.emailservice.application.dto.ResponseEmailDTO;
import com.dvoracekmartin.common.event.email.EmailObjectsEnum;
import com.dvoracekmartin.emailservice.application.dto.ResponseEmailLogDTO;

import java.util.List;

public interface EmailService {
    void createOrUpdateEmail(EmailDTO emailDTO);

    ResponseEmailDTO getTranslatedEmailByType(EmailObjectsEnum emailType);

//    void sendEmail(EmailDTO emailDTO, List<String> recipients);

    List<ResponseEmailLogDTO> getResponseEmailLogEntries();

    void sendEmail(EmailSendDTO emailSendDTO);
}
