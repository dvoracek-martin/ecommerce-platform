package com.dvoracekmartin.customerservice.application.dto;

import com.dvoracekmartin.customerservice.domain.model.Address;

public record ResponseCustomerDTO(
        String id,
        String email,
        String firstName,
        String lastName,
        CustomerAddressDTO address,
        int statusCode
) {
}
