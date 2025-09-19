package com.dvoracekmartin.customerservice.web.controller.v1;

import com.dvoracekmartin.common.dto.customer.ResponseCustomerDTO;
import com.dvoracekmartin.customerservice.application.dto.UpdateCustomerDTO;
import com.dvoracekmartin.customerservice.application.service.CustomerService;
import jakarta.validation.Valid;
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

    @GetMapping("/{customerId}")
    public ResponseEntity<ResponseCustomerDTO> getCustomerById(@PathVariable @NotBlank String customerId) {
        log.debug("Fetching customer: {}", customerId);
        ResponseCustomerDTO dto = customerService.getCustomerById(customerId);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{customerId}")
    public ResponseEntity<Void> deleteCustomerAdmin(@PathVariable @NotBlank String customerId) {
        log.info("Admin deleting customer: {}", customerId);
        customerService.deleteCustomer(customerId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{customerId}")
    @PreAuthorize("hasRole('user_client')")
    public ResponseEntity<ResponseCustomerDTO> updateCustomer(@PathVariable @NotBlank String customerId,
                                                              @Valid @RequestBody UpdateCustomerDTO updateCustomerDTO) {
        log.info("Updating customer: {}", customerId);
        ResponseCustomerDTO updated = customerService.updateCustomerAdmin(customerId, updateCustomerDTO);
        return ResponseEntity.status(updated.statusCode()).body(updated);
    }
}
