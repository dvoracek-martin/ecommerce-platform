package com.dvoracek.configurationservice.domain.repository;

import com.dvoracek.configurationservice.domain.model.AppSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppSettingsRepository extends JpaRepository<AppSettings, Long> {

    Optional<AppSettings> findFirstByOrderByIdDesc();
}
