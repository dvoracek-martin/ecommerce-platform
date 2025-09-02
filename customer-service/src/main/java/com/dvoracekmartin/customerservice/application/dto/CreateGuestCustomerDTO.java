package com.dvoracekmartin.customerservice.application.dto;

import com.dvoracekmartin.common.dto.customer.CustomerAddressDTO;
import com.dvoracekmartin.common.dto.customer.CustomerBillingAddressDTO;
import lombok.Data;

@Data
public class CreateGuestCustomerDTO {
    private String firstName;
    private String lastName;
    private String email;
    private CustomerAddressDTO address;
    private CustomerBillingAddressDTO billingAddress;
}
