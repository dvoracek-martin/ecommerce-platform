package com.dvoracek.translationservice.domain.repository;

import com.dvoracek.translationservice.domain.model.EmailTemplateTranslation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailTemplateTranslationRepository extends JpaRepository<EmailTemplateTranslation, Long> {

    List<EmailTemplateTranslation> findAllByEntityId(Long entityId);

    void deleteAllByEntityId(Long entityId);

    Optional<EmailTemplateTranslation> findByEntityIdAndLocale(Long entityId, String locale);
}
