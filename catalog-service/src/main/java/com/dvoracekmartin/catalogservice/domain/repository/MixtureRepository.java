package com.dvoracekmartin.catalogservice.domain.repository;

import com.dvoracekmartin.catalogservice.domain.model.Mixture;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MixtureRepository extends JpaRepository<Mixture, Long> {

    boolean existsByName(@NotBlank @Size(min = 3) String name);
}
