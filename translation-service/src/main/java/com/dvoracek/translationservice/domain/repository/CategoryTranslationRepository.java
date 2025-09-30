package com.dvoracek.translationservice.domain.repository;

import com.dvoracek.translationservice.domain.model.CategoryTranslation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryTranslationRepository extends JpaRepository<CategoryTranslation, Long> {

    List<CategoryTranslation> findAllByEntityId(Long entityId);

    void deleteAllByEntityId(Long entityId);

    Optional<CategoryTranslation> findByEntityIdAndLocale(Long entityId, String locale);
}
