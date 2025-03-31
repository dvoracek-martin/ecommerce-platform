package com.dvoracekmartin.customerservice.application.service;

import com.dvoracekmartin.customerservice.application.dto.CreateCustomerDTO;
import com.dvoracekmartin.customerservice.application.dto.CustomerMapper;
import com.dvoracekmartin.customerservice.application.dto.ResponseCustomerDTO;
import com.dvoracekmartin.customerservice.application.dto.UpdateCustomerDTO;
import com.dvoracekmartin.customerservice.domain.model.Customer;
import com.dvoracekmartin.customerservice.domain.repository.CustomerRepository;
import jakarta.ws.rs.core.Response;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {

    private final CustomerMapper customerMapper;
    private final CustomerRepository customerRepository;

    public CustomerServiceImpl(CustomerMapper customerMapper, CustomerRepository customerRepository) {
        this.customerMapper = customerMapper;
        this.customerRepository = customerRepository;
    }

    @Override
    public List<ResponseCustomerDTO> getAllCustomers() {
        return List.of();
    }

    @Override
    public ResponseCustomerDTO getCustomerById(String customerId) {
        return null;
    }

    @Override
    public ResponseCustomerDTO createCustomer(CreateCustomerDTO createCustomerDTO) {
        // 1) Check if customer already exists
        if (customerRepository.existsByUsername(createCustomerDTO.username())) {
            return customerMapper.createCustomerDTOToResponseCustomerDTO(
                    createCustomerDTO,
                    Response.Status.CONFLICT.getStatusCode()
            );
        }
        // 4) Save customer in our local DB
        Customer customerEntity = customerMapper.createCustomerDTOToCustomer(createCustomerDTO);
        Customer savedCustomer = customerRepository.save(customerEntity);

        return customerMapper.customerToResponseCustomerDTO(savedCustomer);
    }

    @Override
    public ResponseCustomerDTO updateCustomer(String customerId, UpdateCustomerDTO updateCustomerDTO) {
        return null;
    }

    @Override
    public ResponseCustomerDTO deleteCustomer(String customerId) {
        return null;
    }
}
