package com.dvoracekmartin.catalogservice.domain.repository;

import com.dvoracekmartin.catalogservice.domain.model.Product;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByName(@NotBlank String name);
}
