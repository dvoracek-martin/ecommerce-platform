package com.dvoracekmartin.catalogservice.domain.repository;

import com.dvoracekmartin.catalogservice.domain.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagRepository extends JpaRepository<Tag, Long> {
}
