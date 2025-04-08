package com.dvoracekmartin.customerservice.application.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateCustomerDTO(
        @NotBlank String email,
        String firstName,
        String lastName,
        CustomerAddressDTO address,
        CustomerBillingAddressDTO billingAddress
) {
}
