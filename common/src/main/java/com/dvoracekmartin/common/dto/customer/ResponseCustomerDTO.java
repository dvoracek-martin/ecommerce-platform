package com.dvoracekmartin.common.dto.customer;

public record ResponseCustomerDTO(
        String id,
        boolean active,
        String email,
        String firstName,
        String lastName,
        CustomerAddressDTO address,
        CustomerBillingAddressDTO billingAddress,
        int statusCode,
        Integer preferredLanguageId
) {
}
