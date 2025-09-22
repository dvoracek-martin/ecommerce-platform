package com.dvoracek.configurationservice.domain.repository;

import com.dvoracek.configurationservice.domain.model.Locale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocaleRepository extends JpaRepository<Locale, Long> {
    List<Locale> findByInUseTrue();
}
