package com.dvoracekmartin.customerservice.application.dto;

import com.dvoracekmartin.common.dto.customer.CustomerAddressDTO;
import com.dvoracekmartin.common.dto.customer.CustomerBillingAddressDTO;
import com.dvoracekmartin.common.dto.customer.ResponseCustomerDTO;
import com.dvoracekmartin.customerservice.domain.model.Address;
import com.dvoracekmartin.customerservice.domain.model.BillingAddress;
import com.dvoracekmartin.customerservice.domain.model.Customer;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CustomerMapper {

    ResponseCustomerDTO customerToResponseCustomerDTO(Customer customer);

    ResponseCustomerDTO createCustomerDTOToResponseCustomerDTO(CreateCustomerDTO createCustomerDTO, int statusCode);

    CustomerAddressDTO addressToCustomerAddressDTO(Address address);

    Customer createCustomerDTOToCustomer(CreateCustomerDTO createCustomerDTO);

    CustomerBillingAddressDTO billingAaddressToCustomerBillingAddressDTO(BillingAddress billingAddress);

    Address customerAddressDTOToAddress(CustomerAddressDTO address);

    BillingAddress customerBillingAddressDTOToAddress(CustomerBillingAddressDTO customerBillingAddressDTO);

    Customer createGuestCustomerDTOToCustomer(CreateGuestCustomerDTO createGuestCustomerDTO);
}
