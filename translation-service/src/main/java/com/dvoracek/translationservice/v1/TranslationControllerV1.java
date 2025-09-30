package com.dvoracek.translationservice.v1;

import com.dvoracek.translationservice.domain.service.TranslationService;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import com.dvoracekmartin.common.event.translation.TranslationGetOrDeleteEvent;
import com.dvoracekmartin.common.event.translation.TranslationObjectsEnum;
import com.dvoracekmartin.common.event.translation.TranslationSaveEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/translations/v1")
@Validated
@RequiredArgsConstructor
@Slf4j
public class TranslationControllerV1 {

    private final TranslationService translationService;

    @PostMapping("/get")
    public Map<String, LocalizedField> getTranslation(@RequestBody TranslationGetOrDeleteEvent request) {
        log.info("Received translation request: {}", request);

        if (request.getObjectType() == TranslationObjectsEnum.CATEGORY) {
            return translationService.getTranslationsByCategoryId(request.getEntityId());
        } else if (request.getObjectType() == TranslationObjectsEnum.PRODUCT) {
            return translationService.getTranslationsByProductId(request.getEntityId());
        } else if (request.getObjectType() == TranslationObjectsEnum.MIXTURE) {
            return translationService.getTranslationsByMixtureId(request.getEntityId());
        } else if (request.getObjectType() == TranslationObjectsEnum.TAG) {
            return translationService.getTranslationsByTagId(request.getEntityId());
        } else if (request.getObjectType() == TranslationObjectsEnum.EMAIL_TEMPLATE) {
            return translationService.getTranslationsByEmailTemplateId(request.getEntityId());
        } else {
            log.warn("Unknown object type: {}", request.getObjectType());
            return Map.of();
        }
    }


    @PostMapping("/save")
    public void createOrUpdateTranslation(@RequestBody TranslationSaveEvent request) {
        log.info("Received translation save request: {}", request);
        if (request.getObjectType() == TranslationObjectsEnum.CATEGORY) {
            translationService.createOrUpdateCategoryTranslation(request.getEntityId(), request.getLocalizedFields());
        } else if (request.getObjectType() == TranslationObjectsEnum.PRODUCT) {
            translationService.createOrUpdateProductTranslation(request.getEntityId(), request.getLocalizedFields());
        } else if (request.getObjectType() == TranslationObjectsEnum.MIXTURE) {
            translationService.createOrUpdateMixtureTranslation(request.getEntityId(), request.getLocalizedFields());
        } else if (request.getObjectType() == TranslationObjectsEnum.TAG) {
            translationService.createOrUpdateTagTranslation(request.getEntityId(), request.getLocalizedFields());
        }  else if (request.getObjectType() == TranslationObjectsEnum.EMAIL_TEMPLATE) {
            translationService.createOrUpdateEmailTemplateTranslation(request.getEntityId(), request.getLocalizedFields());
        } else {
            log.warn("Unknown object type: {}", request.getObjectType());
        }
    }

    @PostMapping("/delete")
    public void deleteTranslation(@RequestBody TranslationSaveEvent request) {
        log.info("Received translation delete request: {}", request);

        if (request.getObjectType() == TranslationObjectsEnum.CATEGORY) {
            translationService.deleteCategoryTranslation(request.getEntityId());
        } else if (request.getObjectType() == TranslationObjectsEnum.PRODUCT) {
            translationService.deleteProductTranslation(request.getEntityId());
        } else if (request.getObjectType() == TranslationObjectsEnum.MIXTURE) {
            translationService.deleteMixtureTranslation(request.getEntityId());
        } else if (request.getObjectType() == TranslationObjectsEnum.TAG) {
            translationService.deleteTagTranslation(request.getEntityId());
        } else if (request.getObjectType() == TranslationObjectsEnum.EMAIL_TEMPLATE) {
            translationService.deleteEmailTemplateTranslation(request.getEntityId());
        } else {
            log.warn("Unknown object type: {}", request.getObjectType());
        }
    }
}
