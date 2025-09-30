package com.dvoracek.configurationservice.web.controller.v1;

import com.dvoracek.configurationservice.application.dto.ResponseAppSettingsDTO;
import com.dvoracek.configurationservice.application.dto.ResponseLocaleDTO;
import com.dvoracek.configurationservice.domain.service.AppSettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/configuration/v1")
@Validated
@RequiredArgsConstructor
@Slf4j
public class AppSettingsControllerV1 {


    private final AppSettingsService appSettingsService;

    // --- LOCALES ---
    @GetMapping("/available-locales")
    public ResponseEntity<List<ResponseLocaleDTO>> getAvailableLocales() {
        log.info("User getting available locales.");
        return ResponseEntity.ok(appSettingsService.getAvailableLocales());
    }

    @GetMapping("/in-use-locales")
    public ResponseEntity<List<ResponseLocaleDTO>> getInUseLocales() {
        log.info("User getting in-use locales.");
        return ResponseEntity.ok(appSettingsService.getInUseLocales());
    }


    @GetMapping("/last")
    public ResponseEntity<ResponseAppSettingsDTO> getLastAppSettings() {
        log.info("Fetching last AppSettings");
        return ResponseEntity.ok(appSettingsService.getLastAppSettings());
    }
}
