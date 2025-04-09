package com.dvoracekmartin.inventoryservice.domain.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "inventory")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Inventory {

    @Id
    private Long productId;
    private Integer stock;
}
