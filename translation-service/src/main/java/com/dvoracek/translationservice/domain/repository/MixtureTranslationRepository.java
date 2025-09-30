package com.dvoracek.translationservice.domain.repository;

import com.dvoracek.translationservice.domain.model.MixtureTranslation;
import com.dvoracek.translationservice.domain.model.ProductTranslation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MixtureTranslationRepository extends JpaRepository<MixtureTranslation, Long> {

    List<MixtureTranslation> findAllByEntityId(Long entityId);

    void deleteAllByEntityId(Long entityId);

    Optional<MixtureTranslation> findByEntityIdAndLocale(Long entityId, String locale);
}
