package com.dvoracekmartin.common.dto.customer;

public record CustomerBillingAddressDTO(
        String firstName,
        String lastName,
        String phone,
        String companyName,
        String taxId,
        String country,
        String city,
        String street,
        String houseNumber,
        String zipCode
) {
}
