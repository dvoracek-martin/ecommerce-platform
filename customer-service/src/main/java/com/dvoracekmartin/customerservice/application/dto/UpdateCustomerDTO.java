package com.dvoracekmartin.customerservice.application.dto;

import com.dvoracekmartin.common.dto.customer.CustomerAddressDTO;
import com.dvoracekmartin.common.dto.customer.CustomerBillingAddressDTO;
import jakarta.validation.constraints.NotBlank;

public record UpdateCustomerDTO(
        @NotBlank String email,
        boolean active,
        String firstName,
        String lastName,
        CustomerAddressDTO address,
        CustomerBillingAddressDTO billingAddress,
        String preferredLanguage
) {
}
