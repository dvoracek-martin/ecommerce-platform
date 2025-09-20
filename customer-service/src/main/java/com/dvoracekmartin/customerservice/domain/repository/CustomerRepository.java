package com.dvoracekmartin.customerservice.domain.repository;

import com.dvoracekmartin.customerservice.domain.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, String> {
    Optional<Customer> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
