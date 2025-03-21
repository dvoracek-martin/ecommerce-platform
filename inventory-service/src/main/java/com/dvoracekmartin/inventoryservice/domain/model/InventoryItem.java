package com.dvoracekmartin.inventoryservice.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "inventory")
@Getter
@NoArgsConstructor
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @Column(nullable = false, unique = true)
    private String productCode;

    @Getter
    @Column(nullable = false)
    private int quantity;

    public InventoryItem(String productCode, int quantity) {
        this.productCode = productCode;
        this.quantity = quantity;
    }

    public static InventoryItemBuilder InventoryItemBuilder() {
        return new InventoryItemBuilder();
    }

    @Setter
    public static class InventoryItemBuilder {
        private String productCode;
        private int quantity;

        public InventoryItemBuilder productCode(String productCode) {
            this.productCode = productCode;
            return this;
        }

        public InventoryItemBuilder quantity(int quantity) {
            this.quantity = quantity;
            return this;
        }

        public InventoryItem build() {
            return new InventoryItem(this.productCode, this.quantity);
        }
    }

    public void increaseQuantity(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Increase amount must be positive");
        }
        this.quantity += amount;
    }

    public void decreaseQuantity(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Decrease amount must be positive");
        }
        if (this.quantity < amount) {
            throw new IllegalStateException("Not enough stock available");
        }
        this.quantity -= amount;
    }
}
