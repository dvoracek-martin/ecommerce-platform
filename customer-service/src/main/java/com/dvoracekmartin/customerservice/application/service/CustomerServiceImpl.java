package com.dvoracekmartin.customerservice.application.service;

import com.dvoracekmartin.customerservice.application.dto.CreateCustomerDTO;
import com.dvoracekmartin.customerservice.application.dto.CustomerMapper;
import com.dvoracekmartin.customerservice.application.dto.ResponseCustomerDTO;
import com.dvoracekmartin.customerservice.application.dto.UpdateCustomerDTO;
import com.dvoracekmartin.customerservice.domain.model.Customer;
import com.dvoracekmartin.customerservice.domain.repository.CustomerRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.ws.rs.core.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {

    private static final Logger LOG = LoggerFactory.getLogger(CustomerServiceImpl.class);

    private final CustomerMapper customerMapper;
    private final CustomerRepository customerRepository;

    public CustomerServiceImpl(CustomerMapper customerMapper, CustomerRepository customerRepository) {
        this.customerMapper = customerMapper;
        this.customerRepository = customerRepository;
    }

    @Override
    public List<ResponseCustomerDTO> getAllCustomers() {
        return customerRepository.findAll()
                .stream()
                .map(customerMapper::customerToResponseCustomerDTO)
                .toList();
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
        // 2) Save customer in our local DB
        Customer customerEntity = customerMapper.createCustomerDTOToCustomer(createCustomerDTO);
        Customer savedCustomer = customerRepository.save(customerEntity);

        LOG.debug("Created Customer : {}", savedCustomer);
        return customerMapper.customerToResponseCustomerDTO(savedCustomer);
    }

    @Override
    public ResponseCustomerDTO updateCustomer(String customerId, UpdateCustomerDTO updateCustomerDTO) {
        // 1) Validate the customer exists
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new EntityNotFoundException("Customer not found with id: " + customerId));

        // 2) Validate the email matches (if email is used for authentication)
        if (!customer.getEmail().equals(updateCustomerDTO.email())) {
            throw new IllegalArgumentException("Email cannot be changed or does not match");
        }

        // 3) Update the customer details
        customer.setFirstName(updateCustomerDTO.firstName());
        customer.setLastName(updateCustomerDTO.lastName());

        // 4) Update or create address
        customer.setAddress(customerMapper.customerAddressDTOToAddress(updateCustomerDTO.address()));
        customer.setBillingAddress(customerMapper.customerBillingAddressDTOToAddress(updateCustomerDTO.billingAddress()));

        // 5. Save the updated customer
        Customer updatedCustomer = customerRepository.save(customer);

        LOG.debug("Updated Customer : {}", updatedCustomer);
        // 6. Return the response DTO
        return new ResponseCustomerDTO(
                updatedCustomer.getId(),
                updatedCustomer.getEmail(),
                updatedCustomer.getFirstName(),
                updatedCustomer.getLastName(),
                customerMapper.addressToCustomerAddressDTO(updatedCustomer.getAddress()),
                customerMapper.billingAaddressToCustomerBillingAddressDTO(updatedCustomer.getBillingAddress()),
                Response.Status.OK.getStatusCode()
        );
    }

    @Override
    public void deleteCustomer(String customerId) {
        // TODO implement properly
        customerRepository.deleteById(customerId);
    }
}
