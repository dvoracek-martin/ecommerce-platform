package com.dvoracekmartin.customerservice.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "address")
@Getter
@Setter
@NoArgsConstructor
public class Address {

    @Id
    @Column(nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private String id;

    @Column
    private String country;

    @Column
    private String city;

    @Column
    private String street;

    @Column
    private String houseNumber;

    @Column
    private String zipCode;
}
