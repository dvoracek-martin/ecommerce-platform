package com.dvoracekmartin.customerservice.application.dto;

public record UpdateCustomerDTO(
        String username,
        String email,
        String firstName,
        String lastName,
        CustomerAddressDTO address
) {
}
