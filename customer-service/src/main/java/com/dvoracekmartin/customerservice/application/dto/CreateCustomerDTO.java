package com.dvoracekmartin.customerservice.application.dto;

import com.dvoracekmartin.common.dto.customer.CustomerAddressDTO;
import com.dvoracekmartin.common.dto.customer.CustomerBillingAddressDTO;
import jakarta.validation.constraints.NotBlank;

public record CreateCustomerDTO(
        @NotBlank String id,
        String username,
        @NotBlank String email,
        String phone,
        String firstName,
        String lastName,
        CustomerAddressDTO address,
        CustomerBillingAddressDTO billingAddress,
        String preferredLanguage
) {
}
