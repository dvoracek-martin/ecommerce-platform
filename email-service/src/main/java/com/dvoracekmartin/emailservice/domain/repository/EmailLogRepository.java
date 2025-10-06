package com.dvoracekmartin.emailservice.domain.repository;

import com.dvoracekmartin.emailservice.domain.model.EmailLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {
}
