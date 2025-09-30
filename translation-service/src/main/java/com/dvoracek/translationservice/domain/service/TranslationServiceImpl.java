package com.dvoracek.translationservice.domain.service;

import com.dvoracek.translationservice.domain.model.*;
import com.dvoracek.translationservice.domain.repository.*;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@AllArgsConstructor
@Transactional
public class TranslationServiceImpl implements TranslationService {

    private final CategoryTranslationRepository categoryTranslationRepository;
    private final ProductTranslationRepository productTranslationRepository;
    private final MixtureTranslationRepository mixtureTranslationRepository;
    private final TagTranslationRepository tagTranslationRepository;
    private final EmailTemplateTranslationRepository emailTemplateTranslationRepository;

    // ---------------- CATEGORIES ----------------

    @Override
    public void createOrUpdateCategoryTranslation(Long entityId, Map<String, LocalizedField> localizedFieldMap) {
        localizedFieldMap.forEach((locale, field) -> {
            Optional<CategoryTranslation> optionalTranslation =
                    categoryTranslationRepository.findByEntityIdAndLocale(entityId, locale);

            CategoryTranslation categoryTranslation = optionalTranslation
                    .map(existing -> {
                        existing.setName(field.getName());
                        existing.setDescription(field.getDescription());
                        existing.setUrl(field.getUrl());
                        return existing;
                    })
                    .orElseGet(() -> new CategoryTranslation(entityId, locale,
                            field.getName(), field.getDescription(), field.getUrl()));

            categoryTranslationRepository.save(categoryTranslation);
        });
    }

    @Override
    public Map<String, LocalizedField> getTranslationsByCategoryId(Long entityId) {
        List<CategoryTranslation> categoryTranslationList = categoryTranslationRepository.findAllByEntityId(entityId);
        Map<String, LocalizedField> localizedFieldMap = new HashMap<>();
        categoryTranslationList.forEach(categoryTranslation ->
                localizedFieldMap.put(categoryTranslation.getLocale(),
                        new LocalizedField(categoryTranslation.getName(),
                                categoryTranslation.getDescription(),
                                categoryTranslation.getUrl())));
        return localizedFieldMap;
    }

    @Override
    public void deleteCategoryTranslation(Long entityId) {
        categoryTranslationRepository.deleteAllByEntityId(entityId);
    }

    // ---------------- PRODUCTS ----------------

    @Override
    public void createOrUpdateProductTranslation(Long entityId, Map<String, LocalizedField> localizedFieldMap) {
        localizedFieldMap.forEach((locale, field) -> {
            Optional<ProductTranslation> optionalTranslation =
                    productTranslationRepository.findByEntityIdAndLocale(entityId, locale);

            ProductTranslation productTranslation = optionalTranslation
                    .map(existing -> {
                        existing.setName(field.getName());
                        existing.setDescription(field.getDescription());
                        existing.setUrl(field.getUrl());
                        return existing;
                    })
                    .orElseGet(() -> new ProductTranslation(entityId, locale,
                            field.getName(), field.getDescription(), field.getUrl()));

            productTranslationRepository.save(productTranslation);
        });
    }

    @Override
    public Map<String, LocalizedField> getTranslationsByProductId(Long entityId) {
        List<ProductTranslation> productTranslationList = productTranslationRepository.findAllByEntityId(entityId);
        Map<String, LocalizedField> localizedFieldMap = new HashMap<>();
        productTranslationList.forEach(productTranslation ->
                localizedFieldMap.put(productTranslation.getLocale(),
                        new LocalizedField(productTranslation.getName(),
                                productTranslation.getDescription(),
                                productTranslation.getUrl())));
        return localizedFieldMap;
    }

    @Override
    public void deleteProductTranslation(Long entityId) {
        productTranslationRepository.deleteAllByEntityId(entityId);
    }

    // ---------------- MIXTURES ----------------

    @Override
    public void createOrUpdateMixtureTranslation(Long entityId, Map<String, LocalizedField> localizedFieldMap) {
        localizedFieldMap.forEach((locale, field) -> {
            Optional<MixtureTranslation> optionalTranslation =
                    mixtureTranslationRepository.findByEntityIdAndLocale(entityId, locale);

            MixtureTranslation mixtureTranslation = optionalTranslation
                    .map(existing -> {
                        existing.setName(field.getName());
                        existing.setDescription(field.getDescription());
                        existing.setUrl(field.getUrl());
                        return existing;
                    })
                    .orElseGet(() -> new MixtureTranslation(entityId, locale,
                            field.getName(), field.getDescription(), field.getUrl()));

            mixtureTranslationRepository.save(mixtureTranslation);
        });
    }

    @Override
    public Map<String, LocalizedField> getTranslationsByMixtureId(Long entityId) {
        List<MixtureTranslation> mixtureTranslationList = mixtureTranslationRepository.findAllByEntityId(entityId);
        Map<String, LocalizedField> localizedFieldMap = new HashMap<>();
        mixtureTranslationList.forEach(mixtureTranslation ->
                localizedFieldMap.put(mixtureTranslation.getLocale(),
                        new LocalizedField(mixtureTranslation.getName(),
                                mixtureTranslation.getDescription(),
                                mixtureTranslation.getUrl())));
        return localizedFieldMap;
    }

    @Override
    public void deleteMixtureTranslation(Long entityId) {
        mixtureTranslationRepository.deleteAllByEntityId(entityId);
    }

    // ---------------- TAGS ----------------

    @Override
    public void createOrUpdateTagTranslation(Long entityId, Map<String, LocalizedField> localizedFieldMap) {
        localizedFieldMap.forEach((locale, field) -> {
            Optional<TagTranslation> optionalTranslation =
                    tagTranslationRepository.findByEntityIdAndLocale(entityId, locale);

            TagTranslation tagTranslation = optionalTranslation
                    .map(existing -> {
                        existing.setName(field.getName());
                        existing.setDescription(field.getDescription());
                        existing.setUrl(field.getUrl());
                        return existing;
                    })
                    .orElseGet(() -> new TagTranslation(entityId, locale,
                            field.getName(), field.getDescription(), field.getUrl()));

            tagTranslationRepository.save(tagTranslation);
        });
    }

    @Override
    public Map<String, LocalizedField> getTranslationsByTagId(Long entityId) {
        List<TagTranslation> tagTranslationList = tagTranslationRepository.findAllByEntityId(entityId);
        Map<String, LocalizedField> localizedFieldMap = new HashMap<>();
        tagTranslationList.forEach(tagTranslation ->
                localizedFieldMap.put(tagTranslation.getLocale(),
                        new LocalizedField(tagTranslation.getName(),
                                tagTranslation.getDescription(),
                                tagTranslation.getUrl())));
        return localizedFieldMap;
    }

    @Override
    public void deleteTagTranslation(Long entityId) {
        tagTranslationRepository.deleteAllByEntityId(entityId);
    }

    // ---------------- EMAIL TEMPLATE ----------------

    @Override
    public void createOrUpdateEmailTemplateTranslation(Long entityId, Map<String, LocalizedField> localizedFieldMap) {
        localizedFieldMap.forEach((locale, field) -> {
            Optional<EmailTemplateTranslation> optionalTranslation =
                    emailTemplateTranslationRepository.findByEntityIdAndLocale(entityId, locale);

            EmailTemplateTranslation emailTemplateTranslation = optionalTranslation
                    .map(existing -> {
                        existing.setSubject(field.getName());
                        existing.setBody(field.getDescription());
                        return existing;
                    })
                    .orElseGet(() -> new EmailTemplateTranslation(entityId, locale,
                            field.getName(), field.getDescription()));

            emailTemplateTranslationRepository.save(emailTemplateTranslation);
        });
    }

    @Override
    public Map<String, LocalizedField> getTranslationsByEmailTemplateId(Long entityId) {
        List<EmailTemplateTranslation> emailTemplateTranslationList = emailTemplateTranslationRepository.findAllByEntityId(entityId);
        Map<String, LocalizedField> localizedFieldMap = new HashMap<>();
        emailTemplateTranslationList.forEach(emailTemplateTranslation ->
                localizedFieldMap.put(emailTemplateTranslation.getLocale(),
                        new LocalizedField(emailTemplateTranslation.getSubject(),
                                emailTemplateTranslation.getBody(), null)));
        return localizedFieldMap;
    }

    @Override
    public void deleteEmailTemplateTranslation(Long entityId) {
        emailTemplateTranslationRepository.deleteAllByEntityId(entityId);
    }
}
