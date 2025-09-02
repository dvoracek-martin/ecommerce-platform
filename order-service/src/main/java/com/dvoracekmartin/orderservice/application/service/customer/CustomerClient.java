package com.dvoracekmartin.orderservice.application.service.customer;

import com.dvoracekmartin.common.dto.customer.ResponseCustomerDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "customer-service", url = "http://localhost:8080/api/customers/v1")
public interface CustomerClient {

    @GetMapping("/{customerId}")
    ResponseCustomerDTO getCustomerById(@PathVariable("customerId") String customerId);
}
