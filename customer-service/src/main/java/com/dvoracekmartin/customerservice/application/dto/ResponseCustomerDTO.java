package com.dvoracekmartin.customerservice.application.dto;

public record ResponseCustomerDTO(
        String id,
        String username,
        String email,
        String firstName,
        String lastName,
        int statusCode
) {
}
