package com.dvoracekmartin.customerservice.web.controller.v1;

import com.dvoracekmartin.customerservice.application.dto.ResponseCustomerDTO;
import com.dvoracekmartin.customerservice.application.dto.UpdateCustomerDTO;
import com.dvoracekmartin.customerservice.application.service.CustomerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer/v1")
public class CustomerControllerV1 {

    private final CustomerService customerService;

    public CustomerControllerV1(CustomerService customerService) {
        this.customerService = customerService;
    }

    // -------------------------------------------------------------
    // GET a customer by ID
    // -------------------------------------------------------------
    @GetMapping("/{customerId}")
    public ResponseEntity<ResponseCustomerDTO> getCustomerById(@PathVariable String customerId) {
        ResponseCustomerDTO dto = customerService.getCustomerById(customerId);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
            return ResponseEntity.ok(dto);
    }

    // -------------------------------------------------------------
    // UPDATE customer (self-service)
    // -------------------------------------------------------------
    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('user_client')")
    public ResponseEntity<ResponseCustomerDTO> updateCustomer(@PathVariable String userId, @RequestBody UpdateCustomerDTO updateCustomerDTO) {
        if (currentUserDoesntMatch(userId)) {
            throw new AccessDeniedException("You are not allowed to update this user");
        }
        ResponseCustomerDTO response = customerService.updateCustomer(userId, updateCustomerDTO);
        return ResponseEntity.status(response.statusCode()).body(response);
    }

    // -------------------------------------------------------------
    // DELETE customer (self-service)
    // -------------------------------------------------------------
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable String userId) {
        if (currentUserDoesntMatch(userId)) {
            throw new AccessDeniedException("You are not allowed to delete this user");
        }
        customerService.deleteCustomer(userId);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------
    // GET ALL customer (admin)
    // -------------------------------------------------------------
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('user_admin')")
    public List<ResponseCustomerDTO> getAllCustomers() {
        return customerService.getAllCustomers();
    }

    // -------------------------------------------------------------
    // DELETE customer (admin)
    // -------------------------------------------------------------
    @DeleteMapping("/admin/{userId}")
    @PreAuthorize("hasRole('user_admin')")
    public ResponseEntity<Void> deleteCustomerAdmin(@PathVariable String userId) {
        customerService.deleteCustomer(userId);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------
    // Helper to compare path userId with the ID from the token
    // -------------------------------------------------------------
    private static boolean currentUserDoesntMatch(String userId) {
        String currentCustomerId = SecurityContextHolder.getContext().getAuthentication().getName();
        return !currentCustomerId.equals(userId);
    }
}
