package com.dvoracekmartin.customerservice.application.dto;

import com.dvoracekmartin.customerservice.domain.model.Customer;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CustomerMapper {

    ResponseCustomerDTO customerToResponseCustomerDTO(Customer customer);

    ResponseCustomerDTO customerToResponseCustomerDTO(Customer customer, int statusCode);

    ResponseCustomerDTO createCustomerDTOToResponseCustomerDTO(CreateCustomerDTO createCustomerDTO, int statusCode);

    ResponseCustomerDTO updateCustomerDTOToResponseCustomerDTO(UpdateCustomerDTO updateCustomerDTO, int status);

    Customer createCustomerDTOToCustomer(CreateCustomerDTO createCustomerDTO);

    Customer updateCustomerDTOToCustomer(UpdateCustomerDTO updateCustomerDTO, String id);
}
