package com.dvoracekmartin.customerservice.application.dto;

public record CustomerAddressDTO(
        String country,
        String city,
        String street,
        String houseNumber,
        String zipCode) {
}
