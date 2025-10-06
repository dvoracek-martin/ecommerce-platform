package com.dvoracekmartin.common.dto.email;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class EmailSendDTO {
    // Getters and Setters
    private String emailType;
    private String subject;
    private String body;
    private List<String> recipients;
    private String language;
    private List<String> customerIds;
}