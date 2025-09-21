package com.dvoracek.configurationservice.domain.repository;

import com.dvoracek.configurationservice.domain.model.AppSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppSettingsRepository extends JpaRepository<AppSettings, Long> {
}
