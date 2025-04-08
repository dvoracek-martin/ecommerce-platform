package com.dvoracekmartin.customerservice.web.controller.v1;

import com.dvoracekmartin.customerservice.application.dto.ResponseCustomerDTO;
import com.dvoracekmartin.customerservice.application.dto.UpdateCustomerDTO;
import com.dvoracekmartin.customerservice.application.service.CustomerService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer/v1")
@Validated
public class CustomerControllerV1 {

    private static final Logger LOG = LoggerFactory.getLogger(CustomerControllerV1.class);
    private final CustomerService customerService;

    public CustomerControllerV1(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<ResponseCustomerDTO> getCustomerById(@PathVariable @NotBlank String customerId) {
        LOG.debug("Fetching customer: {}", customerId);
        ResponseCustomerDTO dto = customerService.getCustomerById(customerId);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{customerId}")
    @PreAuthorize("hasRole('user_client')")
    public ResponseEntity<ResponseCustomerDTO> updateCustomer(@PathVariable @NotBlank String customerId,
                                                              @Valid @RequestBody UpdateCustomerDTO updateCustomerDTO) {
        checkOwnership(customerId);
        LOG.info("Updating customer: {}", customerId);
        ResponseCustomerDTO updated = customerService.updateCustomer(customerId, updateCustomerDTO);
        return ResponseEntity.status(updated.statusCode()).body(updated);
    }

    @DeleteMapping("/{customerId}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable @NotBlank String customerId) {
        checkOwnership(customerId);
        LOG.info("Deleting customer: {}", customerId);
        customerService.deleteCustomer(customerId);
        return ResponseEntity.noContent().build();
    }

    private static void checkOwnership(String customerId) {
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!currentUserId.equals(customerId)) {
            LOG.warn("Access denied for customer: {}", customerId);
            throw new AccessDeniedException("You are not allowed to access this customer.");
        }
    }
}
