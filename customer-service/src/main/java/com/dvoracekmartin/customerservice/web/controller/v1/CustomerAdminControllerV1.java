package com.dvoracekmartin.customerservice.web.controller.v1;

import com.dvoracekmartin.customerservice.application.dto.ResponseCustomerDTO;
import com.dvoracekmartin.customerservice.application.service.CustomerService;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer/v1/admin")
@PreAuthorize("hasRole('user_admin')")
@Validated
public class CustomerAdminControllerV1 {

    private static final Logger LOG = LoggerFactory.getLogger(CustomerAdminControllerV1.class);
    private final CustomerService customerService;

    public CustomerAdminControllerV1(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping("/all")
    public List<ResponseCustomerDTO> getAllCustomers() {
        LOG.info("Admin fetching all customers");
        return customerService.getAllCustomers();
    }

    @DeleteMapping("/{customerId}")
    public ResponseEntity<Void> deleteCustomerAdmin(@PathVariable @NotBlank String customerId) {
        LOG.info("Admin deleting customer: {}", customerId);
        customerService.deleteCustomer(customerId);
        return ResponseEntity.noContent().build();
    }
}
