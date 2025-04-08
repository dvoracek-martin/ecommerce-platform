package com.dvoracekmartin.catalogservice.domain.repository;

import com.dvoracekmartin.catalogservice.domain.model.Mixture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MixtureRepository extends JpaRepository<Mixture, Long> {
}
