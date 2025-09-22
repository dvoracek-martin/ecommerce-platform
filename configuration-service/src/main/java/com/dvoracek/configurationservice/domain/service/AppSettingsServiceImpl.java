package com.dvoracek.configurationservice.domain.service;

import com.dvoracek.configurationservice.application.dto.RequestAppSettingsDTO;
import com.dvoracek.configurationservice.application.dto.ResponseAppSettingsDTO;
import com.dvoracek.configurationservice.application.dto.ResponseLocaleDTO;
import com.dvoracek.configurationservice.domain.model.AppSettings;
import com.dvoracek.configurationservice.domain.model.Locale;
import com.dvoracek.configurationservice.domain.repository.AppSettingsRepository;
import com.dvoracek.configurationservice.domain.repository.LocaleRepository;
import com.dvoracek.configurationservice.utils.AppSettingsMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class AppSettingsServiceImpl implements AppSettingsService {

    private final AppSettingsRepository appSettingsRepository;
    private final LocaleRepository localeRepository;
    private final AppSettingsMapper appSettingsMapper;

    @Override
    public List<ResponseLocaleDTO> getAvailableLocales() {
        return localeRepository.findAll().stream()
                .map(appSettingsMapper::localeToResponseLocaleDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ResponseLocaleDTO> getInUseLocales() {
        return localeRepository.findByInUseTrue().stream()
                .map(appSettingsMapper::localeToResponseLocaleDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ResponseAppSettingsDTO createAppSettings(RequestAppSettingsDTO request) {
        AppSettings appSettings = new AppSettings();
        appSettings.setTheme(request.getTheme());
        appSettings.setUpdatedAt(LocalDateTime.now());

        if (request.getUsedLocales() != null) {
            // jen reference na existující Locale z DB
            List<Locale> locales = request.getUsedLocales().stream()
                    .map(l -> localeRepository.findById(l.id())
                            .orElseThrow(() -> new RuntimeException("Locale not found with id " + l.id())))
                    .collect(Collectors.toList());
            appSettings.setUsedLocales(locales);
        }

        AppSettings saved = appSettingsRepository.save(appSettings);
        return appSettingsMapper.appSettingsToResponseAppSettingsDTO(saved);
    }

    @Override
    public ResponseAppSettingsDTO updateAppSettings(Long id, RequestAppSettingsDTO request) {
        AppSettings existing = appSettingsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AppSettings not found with id " + id));

        existing.setTheme(request.getTheme());
        existing.setUpdatedAt(LocalDateTime.now());

        if (request.getUsedLocales() != null) {

            existing.getUsedLocales().clear();
            List<Locale> locales = request.getUsedLocales().stream()
                    .map(l -> localeRepository.findById(l.id())
                            .orElseThrow(() -> new RuntimeException("Locale not found with id " + l.id())))
                    .collect(Collectors.toList());
            existing.getUsedLocales().addAll(locales);
        }

        AppSettings saved = appSettingsRepository.save(existing);
        return appSettingsMapper.appSettingsToResponseAppSettingsDTO(saved);
    }

    @Override
    public ResponseAppSettingsDTO getAppSettings(Long id) {
        return appSettingsRepository.findById(id)
                .map(appSettingsMapper::appSettingsToResponseAppSettingsDTO)
                .orElseThrow(() -> new RuntimeException("AppSettings not found with id " + id));
    }

    @Override
    public void deleteAppSettings(Long id) {
        if (!appSettingsRepository.existsById(id)) {
            throw new RuntimeException("AppSettings not found with id " + id);
        }
        appSettingsRepository.deleteById(id);
    }

    @Override
    public ResponseAppSettingsDTO getLastAppSettings() {
        AppSettings last = appSettingsRepository.findTopByOrderByIdDesc()
                .orElseThrow(() -> new RuntimeException("No AppSettings found"));
        return appSettingsMapper.appSettingsToResponseAppSettingsDTO(last);
    }
}
