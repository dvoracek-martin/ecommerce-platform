package com.dvoracekmartin.customerservice.application.service;


import com.dvoracekmartin.customerservice.application.dto.CreateCustomerDTO;
import com.dvoracekmartin.common.dto.customer.ResponseCustomerDTO;
import com.dvoracekmartin.customerservice.application.dto.CreateGuestCustomerDTO;
import com.dvoracekmartin.customerservice.application.dto.UpdateCustomerDTO;
import jakarta.validation.Valid;

import java.util.List;


public interface CustomerService {

    List<ResponseCustomerDTO> getAllCustomers();

    ResponseCustomerDTO getCustomerById(String customerId);

    ResponseCustomerDTO createCustomer(CreateCustomerDTO createCustomerDTO);

    ResponseCustomerDTO updateCustomer(String customerId, UpdateCustomerDTO updateCustomerDTO);

    ResponseCustomerDTO updateCustomerAdmin(String customerId, UpdateCustomerDTO updateCustomerDTO);

    void deleteCustomer(String customerId);

    ResponseCustomerDTO createGuestCustomer(@Valid CreateGuestCustomerDTO createGuestCustomerDTO);
}
