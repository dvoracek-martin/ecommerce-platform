package com.dvoracek.configurationservice.application.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ResponseAppSettingsDTO {
    private Long id;
    private String theme;
    private List<ResponseLocaleDTO> usedLocales;
    private ResponseLocaleDTO defaultLocale;
    private String currency;
    private LocalDateTime updatedAt;
}
