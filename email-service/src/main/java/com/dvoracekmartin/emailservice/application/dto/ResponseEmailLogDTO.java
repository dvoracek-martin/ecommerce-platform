package com.dvoracekmartin.emailservice.application.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ResponseEmailLogDTO {
    private Long id;
    private String emailType;
    private String recipient;
    private LocalDateTime sentAt;
    private String body;
    private String subject;
    private String language;
}
