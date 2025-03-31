package com.dvoracekmartin.customerservice.application.service;


import com.dvoracekmartin.customerservice.application.dto.CreateCustomerDTO;
import com.dvoracekmartin.customerservice.application.dto.ResponseCustomerDTO;
import com.dvoracekmartin.customerservice.application.dto.UpdateCustomerDTO;

import java.util.List;


public interface CustomerService {

    List<ResponseCustomerDTO> getAllCustomers();

    ResponseCustomerDTO getCustomerById(String customerId);

    ResponseCustomerDTO createCustomer(CreateCustomerDTO createCustomerDTO);

    ResponseCustomerDTO updateCustomer(String customerId, UpdateCustomerDTO updateCustomerDTO);

    ResponseCustomerDTO deleteCustomer(String customerId);

}
