package com.dvoracekmartin.customerservice.application.service;

import com.dvoracekmartin.customerservice.application.dto.CreateCustomerDTO;
import com.dvoracekmartin.customerservice.application.dto.CustomerMapper;
import com.dvoracekmartin.customerservice.application.dto.ResponseCustomerDTO;
import com.dvoracekmartin.customerservice.application.dto.UpdateCustomerDTO;
import com.dvoracekmartin.customerservice.domain.model.Customer;
import com.dvoracekmartin.customerservice.domain.repository.CustomerRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CustomerServiceImpl implements CustomerService {

    private final CustomerMapper customerMapper;
    private final CustomerRepository customerRepository;

    @Override
    public List<ResponseCustomerDTO> getAllCustomers() {
        return customerRepository.findAll().stream()
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
        if (customerRepository.existsByUsername(createCustomerDTO.username())) {
            return customerMapper.createCustomerDTOToResponseCustomerDTO(
                    createCustomerDTO,
                    Response.Status.CONFLICT.getStatusCode()
            );
        }

        Customer savedCustomer = customerRepository.save(customerMapper.createCustomerDTOToCustomer(createCustomerDTO));
        log.debug("Created Customer: {}", savedCustomer);
        return customerMapper.customerToResponseCustomerDTO(savedCustomer);
    }

    @Override
    public ResponseCustomerDTO updateCustomer(String customerId, UpdateCustomerDTO updateCustomerDTO) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new EntityNotFoundException("Customer not found with id: " + customerId));

        if (!customer.getEmail().equals(updateCustomerDTO.email())) {
            throw new IllegalArgumentException("Email cannot be changed or does not match");
        }

        customer.setFirstName(updateCustomerDTO.firstName());
        customer.setLastName(updateCustomerDTO.lastName());
        customer.setAddress(customerMapper.customerAddressDTOToAddress(updateCustomerDTO.address()));
        customer.setBillingAddress(customerMapper.customerBillingAddressDTOToAddress(updateCustomerDTO.billingAddress()));

        Customer updatedCustomer = customerRepository.save(customer);
        log.debug("Updated Customer: {}", updatedCustomer);

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
        customerRepository.deleteById(customerId);
    }
}
