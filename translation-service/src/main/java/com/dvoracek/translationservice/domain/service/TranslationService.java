package com.dvoracek.translationservice.domain.service;

import com.dvoracekmartin.common.event.translation.LocalizedField;

import java.util.Map;

public interface TranslationService {
    void createOrUpdateCategoryTranslation(Long id, Map<String, LocalizedField> localizedFieldMap);

    void createOrUpdateProductTranslation(Long id, Map<String, LocalizedField> localizedFieldMap);

    Map<String, LocalizedField> getTranslationsByCategoryId(Long id);

    Map<String, LocalizedField> getTranslationsByProductId(Long id);

    void deleteCategoryTranslation(Long entityId);

    void deleteProductTranslation(Long entityId);

    void deleteMixtureTranslation(Long entityId);

    void deleteTagTranslation(Long entityId);

    void createOrUpdateMixtureTranslation(Long entityId, Map<String, LocalizedField> localizedFields);

    void createOrUpdateTagTranslation(Long entityId, Map<String, LocalizedField> localizedFields);

    Map<String, LocalizedField> getTranslationsByMixtureId(Long entityId);

    Map<String, LocalizedField> getTranslationsByTagId(Long entityId);

    Map<String, LocalizedField> getTranslationsByEmailTemplateId(Long entityId);

    void createOrUpdateEmailTemplateTranslation(Long entityId, Map<String, LocalizedField> localizedFields);

    void deleteEmailTemplateTranslation(Long entityId);
}
