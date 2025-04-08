package com.dvoracekmartin.customerservice.application.dto;

public record ResponseCustomerDTO(
        String id,
        String email,
        String firstName,
        String lastName,
        CustomerAddressDTO address,
        CustomerBillingAddressDTO billingAddress,
        int statusCode
) {
}
