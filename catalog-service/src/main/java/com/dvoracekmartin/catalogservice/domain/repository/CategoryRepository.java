package com.dvoracekmartin.catalogservice.domain.repository;

import com.dvoracekmartin.catalogservice.domain.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    public boolean existsByName(String name);
}
