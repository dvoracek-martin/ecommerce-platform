package com.dvoracekmartin.orderservice.domain.repository;

import com.dvoracekmartin.orderservice.domain.model.OrderCounter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrderCounterRepository extends JpaRepository<OrderCounter, Integer> {
    Optional<OrderCounter> findByCounterYear(int currentYear);
}
