package com.dvoracekmartin.common.dto.customer;

public record CustomerAddressDTO(
        String country,
        String city,
        String street,
        String phone,
        String houseNumber,
        String zipCode
) {
}
