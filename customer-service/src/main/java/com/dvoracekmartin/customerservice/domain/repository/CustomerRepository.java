package com.dvoracekmartin.customerservice.domain.repository;

import com.dvoracekmartin.customerservice.domain.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, String> {
    Customer findByUsername(String username);

    boolean existsByUsername(String username);
}
