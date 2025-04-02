package com.dvoracekmartin.customerservice.application.service;

import com.dvoracekmartin.customerservice.application.dto.*;
import com.dvoracekmartin.customerservice.domain.model.Address;
import com.dvoracekmartin.customerservice.domain.model.Customer;
import com.dvoracekmartin.customerservice.domain.repository.CustomerRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.ws.rs.core.Response;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

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
        return customerRepository.findById(customerId)
                .map(customerMapper::customerToResponseCustomerDTO)
                .orElse(null);
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
        // 1. Validate the customer exists
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new EntityNotFoundException("Customer not found with id: " + customerId));

        // 2. Validate the email matches (if email is used for authentication)
        if (!customer.getEmail().equals(updateCustomerDTO.email())) {
            throw new IllegalArgumentException("Email cannot be changed or does not match");
        }

        // 3. Update the customer details
        customer.setFirstName(updateCustomerDTO.firstName());
        customer.setLastName(updateCustomerDTO.lastName());

        // 4. Update or create address
        if (customer.getAddress() == null) {
            customer.setAddress(new Address());
        }

        CustomerAddressDTO addressDTO = updateCustomerDTO.address();
        customer.getAddress().setCountry(addressDTO.country());
        customer.getAddress().setCity(addressDTO.city());
        customer.getAddress().setStreet(addressDTO.street());
        customer.getAddress().setHouseNumber(addressDTO.houseNumber());
        customer.getAddress().setZipCode(addressDTO.zipCode());

        // 5. Save the updated customer
        Customer updatedCustomer = customerRepository.save(customer);

        // 6. Return the response DTO
        return new ResponseCustomerDTO(
                updatedCustomer.getId(),
                updatedCustomer.getEmail(),
                updatedCustomer.getFirstName(),
                updatedCustomer.getLastName(),
                customerMapper.addressToCustomerAddressDTO(updatedCustomer.getAddress()),
                Response.Status.OK.getStatusCode()
        );
    }

    @Override
    public ResponseCustomerDTO deleteCustomer(String customerId) {
        return null;
    }
}
