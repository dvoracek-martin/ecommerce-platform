package com.dvoracekmartin.orderservice.application.service.product;

import com.dvoracekmartin.common.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.common.dto.product.ResponseProductDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "catalog-service", url = "http://localhost:8080/api/catalog/v1")
public interface CatalogClient {
    @GetMapping("/products/{id}")
    ResponseEntity<ResponseProductDTO> getProductById(@PathVariable("id") Long id);

    @GetMapping("/mixtures/{id}")
    ResponseEntity<ResponseMixtureDTO> getMixtureById(@PathVariable("id") Long id);
}
