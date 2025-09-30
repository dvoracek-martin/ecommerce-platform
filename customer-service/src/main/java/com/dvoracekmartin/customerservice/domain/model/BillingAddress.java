package com.dvoracekmartin.customerservice.domain.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode()
@Entity
@Table(name = "billing_address")
@Data
@NoArgsConstructor
public class BillingAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;
    private String phone;
    private String companyName;
    private String taxId;
    private String country;
    private String city;
    private String street;
    private String houseNumber;
    private String zipCode;
}
