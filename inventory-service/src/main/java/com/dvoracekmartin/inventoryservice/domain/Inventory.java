package com.dvoracekmartin.inventoryservice.domain;

import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name = "inventory")
@Getter
public class Inventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String productCode;

    @Column(nullable = false)
    private int stockQuantity;

    protected Inventory() {}  // Required by JPA

    public Inventory(String productCode, int stockQuantity) {
        this.productCode = productCode;
        this.stockQuantity = stockQuantity;
    }

    public boolean isAvailable() {
        return stockQuantity > 0;
    }

    public void reduceStock(int quantity) {
        if (quantity > stockQuantity) {
            throw new IllegalArgumentException("Not enough stock available");
        }
        this.stockQuantity -= quantity;
    }
}
