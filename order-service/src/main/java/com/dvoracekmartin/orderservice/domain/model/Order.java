package com.dvoracekmartin.orderservice.domain.model;

import com.dvoracekmartin.orderservice.application.utils.OrderStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@EqualsAndHashCode()
@Entity
@Table(name = "orders")
@Data
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerId;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<OrderItem> items = new ArrayList<>();

    private Double shippingCost;
    private Double cartTotal;
    private Double finalTotal;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private String shippingMethod;
    private String paymentMethod;
    private LocalDateTime orderDate;
    private String trackingNumber;
    private int orderYearOrderCounter;

    @PrePersist
    protected void onCreate() {
        orderDate = LocalDateTime.now();
        trackingNumber = "TRK" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
