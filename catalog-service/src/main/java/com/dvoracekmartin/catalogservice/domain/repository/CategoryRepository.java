package com.dvoracekmartin.catalogservice.domain.repository;

import com.dvoracekmartin.catalogservice.domain.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    public boolean existsByName(String name);

    Optional<Category> findByName(String name);

    List<Category> findByActiveTrue();

    List<Category> findByActiveTrueAndMixableTrue();
}
