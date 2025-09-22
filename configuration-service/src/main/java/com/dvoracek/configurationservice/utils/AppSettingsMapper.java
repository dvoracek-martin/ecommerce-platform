package com.dvoracek.configurationservice.utils;

import com.dvoracek.configurationservice.application.dto.ResponseAppSettingsDTO;
import com.dvoracek.configurationservice.application.dto.ResponseLocaleDTO;
import com.dvoracek.configurationservice.domain.model.AppSettings;
import com.dvoracek.configurationservice.domain.model.Locale;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AppSettingsMapper {
    ResponseLocaleDTO localeToResponseLocaleDTO(Locale discount);

    ResponseAppSettingsDTO appSettingsToResponseAppSettingsDTO(AppSettings saved);

    Locale responseLocaleDTOToLocale(ResponseLocaleDTO responseLocaleDTO);
}
