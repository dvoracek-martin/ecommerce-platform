package com.dvoracek.cartservice.domain.repository;

import com.dvoracek.cartservice.domain.model.discount.Discount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiscountRepository extends JpaRepository<Discount, Long> {
    Optional<Discount> findByCodeAndActiveTrue(String code);
    boolean existsByCode(String code);
    boolean existsByCodeAndActiveTrue(String code);
}
