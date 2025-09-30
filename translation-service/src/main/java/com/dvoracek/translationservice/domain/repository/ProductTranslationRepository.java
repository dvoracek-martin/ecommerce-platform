package com.dvoracek.translationservice.domain.repository;

import com.dvoracek.translationservice.domain.model.CategoryTranslation;
import com.dvoracek.translationservice.domain.model.ProductTranslation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductTranslationRepository extends JpaRepository<ProductTranslation, Long> {

    List<ProductTranslation> findAllByEntityId(Long entityId);

    void deleteAllByEntityId(Long entityId);

    Optional<ProductTranslation> findByEntityIdAndLocale(Long entityId, String locale);
}
