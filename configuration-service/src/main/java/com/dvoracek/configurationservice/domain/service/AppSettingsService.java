package com.dvoracek.configurationservice.domain.service;

import com.dvoracek.configurationservice.application.dto.RequestAppSettingsDTO;
import com.dvoracek.configurationservice.application.dto.ResponseAppSettingsDTO;
import com.dvoracek.configurationservice.application.dto.ResponseLocaleDTO;

import java.util.List;

public interface AppSettingsService {

    List<ResponseLocaleDTO> getAvailableLocales();
    List<ResponseLocaleDTO> getInUseLocales();

    // CRUD
    ResponseAppSettingsDTO createAppSettings(RequestAppSettingsDTO request);
    ResponseAppSettingsDTO updateAppSettings(Long id, RequestAppSettingsDTO request);
    ResponseAppSettingsDTO getAppSettings(Long id);
    void deleteAppSettings(Long id);

    ResponseAppSettingsDTO getLastAppSettings();
}
