package com.dvoracekmartin.orderservice.domain.repository;

import com.dvoracekmartin.orderservice.application.utils.OrderStatus;
import com.dvoracekmartin.orderservice.domain.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerId(String id);

    List<Order> findByStatus(OrderStatus status);

    Optional<Order> findByIdAndCustomerId(Long id, String customerId);
}
