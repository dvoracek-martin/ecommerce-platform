package com.dvoracekmartin.orderservice.domain.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "order_counter")
@Data
public class OrderCounter {

    @Id
    private int counterYear;

    private int orderNumberCounter;
}
