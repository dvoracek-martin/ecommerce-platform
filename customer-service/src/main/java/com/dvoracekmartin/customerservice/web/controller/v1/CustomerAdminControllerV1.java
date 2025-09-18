package com.dvoracekmartin.customerservice.web.controller.v1;

import com.dvoracekmartin.common.dto.customer.ResponseCustomerDTO;
import com.dvoracekmartin.customerservice.application.service.CustomerService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers/v1/admin")
@PreAuthorize("hasRole('user_admin')")
@Validated
@RequiredArgsConstructor
@Slf4j
public class CustomerAdminControllerV1 {

    private final CustomerService customerService;

    @GetMapping("")
    public List<ResponseCustomerDTO> getAllCustomers() {
        log.info("Admin fetching all customers");
        return customerService.getAllCustomers();
    }

    @DeleteMapping("/{customerId}")
    public ResponseEntity<Void> deleteCustomerAdmin(@PathVariable @NotBlank String customerId) {
        log.info("Admin deleting customer: {}", customerId);
        customerService.deleteCustomer(customerId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{customerId}")
    public ResponseEntity<Void> updateCustomerAdmin(@PathVariable @NotBlank String customerId) {
        log.info("Admin deleting customer: {}", customerId);
        customerService.updateCustomer(customerId);
        return ResponseEntity.noContent().build();
    }
}
