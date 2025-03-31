package com.dvoracekmartin.customerservice.application.dto;

public record CreateCustomerDTO(
        String id,
        String username,
        String email,
        String firstName,
        String lastName,
        CustomerAddressDTO address
) {
}
