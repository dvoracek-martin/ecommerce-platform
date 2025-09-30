package com.dvoracek.translationservice.v1;

import com.dvoracek.translationservice.domain.service.TranslationService;
import com.dvoracekmartin.common.event.translation.TranslationObjectsEnum;
import com.dvoracekmartin.common.event.translation.TranslationSaveEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/translations/v1/admin")
@PreAuthorize("hasRole('user_admin')")
@Validated
@RequiredArgsConstructor
@Slf4j
public class TranslationAdminControllerV1 {

    private final TranslationService translationService;


    @PostMapping("/save")
    public void saveTranslation(@RequestBody TranslationSaveEvent request) {
        log.info("Received translation save request: {}", request);

        if (request.getObjectType() == TranslationObjectsEnum.CATEGORY) {
            translationService.createOrUpdateCategoryTranslation(request.getEntityId(), request.getLocalizedFields());
        } else if (request.getObjectType() == TranslationObjectsEnum.PRODUCT) {
            translationService.createOrUpdateProductTranslation(request.getEntityId(), request.getLocalizedFields());
        } else {
            log.warn("Unknown object type: {}", request.getObjectType());
        }
    }

}
