package com.dvoracek.configurationservice.web.controller.v1;

import com.dvoracek.configurationservice.application.dto.RequestAppSettingsDTO;
import com.dvoracek.configurationservice.application.dto.ResponseAppSettingsDTO;
import com.dvoracek.configurationservice.application.dto.ResponseLocaleDTO;
import com.dvoracek.configurationservice.domain.service.AppSettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/configuration/v1/admin")
@PreAuthorize("hasRole('user_admin')")
@Validated
@RequiredArgsConstructor
@Slf4j
public class AppSettingsAdminControllerV1 {

    private final AppSettingsService appSettingsService;

    // --- LOCALES ---
    @GetMapping("/available-locales")
    public ResponseEntity<List<ResponseLocaleDTO>> getAvailableLocales() {
        log.info("Admin getting available locales.");
        return ResponseEntity.ok(appSettingsService.getAvailableLocales());
    }

    @GetMapping("/in-use-locales")
    public ResponseEntity<List<ResponseLocaleDTO>> getInUseLocales() {
        log.info("Admin getting in-use locales.");
        return ResponseEntity.ok(appSettingsService.getInUseLocales());
    }

    // --- CRUD AppSettings ---
    @PostMapping()
    public ResponseEntity<ResponseAppSettingsDTO> createAppSettings(
            @RequestBody RequestAppSettingsDTO request) {
        log.info("Creating new AppSettings.");
        return ResponseEntity.ok(appSettingsService.createAppSettings(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseAppSettingsDTO> getAppSettings(@PathVariable Long id) {
        log.info("Fetching AppSettings with id {}", id);
        return ResponseEntity.ok(appSettingsService.getAppSettings(id));
    }

    @GetMapping()
    public ResponseEntity<ResponseAppSettingsDTO> getLastAppSettings() {
        log.info("Fetching last AppSettings");
        return ResponseEntity.ok(appSettingsService.getLastAppSettings());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResponseAppSettingsDTO> updateAppSettings(
            @PathVariable Long id,
            @RequestBody RequestAppSettingsDTO request) {
        log.info("Updating AppSettings with id {}", id);
        return ResponseEntity.ok(appSettingsService.updateAppSettings(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppSettings(@PathVariable Long id) {
        log.info("Deleting AppSettings with id {}", id);
        appSettingsService.deleteAppSettings(id);
        return ResponseEntity.noContent().build();
    }
}
