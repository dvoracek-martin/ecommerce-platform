package com.dvoracekmartin.catalogservice.v1;

import com.dvoracekmartin.catalogservice.application.dto.ResponseCatalogItemDTO;
import com.dvoracekmartin.catalogservice.application.dto.ResponseCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.ResponseMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.ResponseProductDTO;
import com.dvoracekmartin.catalogservice.application.service.CatalogService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/catalog/v1/")
@Validated
public class CatalogControllerV1 {

    private final CatalogService catalogService;

    public CatalogControllerV1(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/all-products-and-mixtures")
    public List<ResponseCatalogItemDTO> getAllProductsAndMixtures() {
        return catalogService.getAllProductsAndMixtures();
    }

    @GetMapping("/all-products")
    public List<ResponseProductDTO> getAllProducts() {
        return catalogService.getAllProducts();
    }

    @GetMapping("/all-mixtures")
    public List<ResponseMixtureDTO> getAllMixtures() {
        return catalogService.getAllMixtures();
    }

    @GetMapping("/all-categories")
    public List<ResponseCategoryDTO> getAllCategories() {
        return catalogService.getAllCategories();
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ResponseProductDTO> getProductById(@PathVariable Long id) {
        ResponseProductDTO productDTO = catalogService.getProductById(id);
        return ResponseEntity.ok(productDTO);
    }

    @GetMapping("/mixtures/{id}")
    public ResponseEntity<ResponseMixtureDTO> getMixtureById(@PathVariable Long id) {
        ResponseMixtureDTO mixtureDTO = catalogService.getMixtureById(id);
        return ResponseEntity.ok(mixtureDTO);
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<ResponseCategoryDTO> getCategoryById(@PathVariable Long id) {
        ResponseCategoryDTO categoryDTO = catalogService.getCategoryById(id);
        return ResponseEntity.ok(categoryDTO);
    }
}
