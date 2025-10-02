package com.dvoracekmartin.catalogservice;

import com.dvoracekmartin.catalogservice.application.dto.category.CreateCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.UpdateProductStockDTO;
import com.dvoracekmartin.catalogservice.application.dto.search.ResponseSearchResultDTO;
import com.dvoracekmartin.catalogservice.application.elasticsearch.service.ElasticsearchServiceImpl;
import com.dvoracekmartin.catalogservice.application.service.CatalogService;
import com.dvoracekmartin.catalogservice.web.controller.v1.CatalogAdminControllerV1;
import com.dvoracekmartin.common.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.common.dto.product.ResponseProductDTO;
import com.dvoracekmartin.common.dto.tag.ResponseTagDTO;
import com.dvoracekmartin.common.event.ResponseProductStockEvent;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class CatalogAdminControllerV1Test {

    private CatalogService catalogService;
    private ElasticsearchServiceImpl elasticsearchService;
    private CatalogAdminControllerV1 controller;

    @BeforeEach
    void setUp() {
        catalogService = mock(CatalogService.class);
        elasticsearchService = mock(ElasticsearchServiceImpl.class);
        controller = new CatalogAdminControllerV1(catalogService, elasticsearchService);
    }

    private MediaDTO dummyMedia() {
        return new MediaDTO("dummyBase64", "dummyKey", "image/jpeg");
    }

    private ResponseProductDTO dummyProduct() {
        return new ResponseProductDTO(
                1L, Map.of("en", new LocalizedField("name", "desc", "url")), 1, true,
                List.of(dummyMedia()), List.of(), 1L, 10.0, 100.0, true, true
        );
    }

    private ResponseMixtureDTO dummyMixture() {
        return new ResponseMixtureDTO(
                1L, "Mix", Map.of("en", new LocalizedField("name", "desc", "url")), 1,
                true, List.of(dummyMedia()), 1L, List.of(dummyProduct()), List.of(1L), 20.0, 200.0, true
        );
    }

    private ResponseCategoryDTO dummyCategory() {
        return new ResponseCategoryDTO(
                1L, Map.of("en", new LocalizedField("name", "desc", "url")), 1, true,
                List.of(dummyMedia()), List.of(), true
        );
    }

    private ResponseTagDTO dummyTag() {
        return new ResponseTagDTO(
                1L, Map.of("en", new LocalizedField("name", "desc", "url")), 1, true,
                List.of(dummyMedia()), List.of(dummyCategory()), List.of(dummyProduct()), List.of(dummyMixture())
        );
    }

    @Test
    void testGetAllProducts() {
        when(catalogService.getAllProducts()).thenReturn(List.of(dummyProduct()));
        var products = controller.getAllProducts();
        assertEquals(1, products.size());
        verify(catalogService).getAllProducts();
    }

    @Test
    void testGetProductById() {
        ResponseProductDTO dto = dummyProduct();
        when(catalogService.getProductById(1L)).thenReturn(dto);

        ResponseEntity<ResponseProductDTO> response = controller.getProductById(1L);

        assertEquals(dto, response.getBody());
        assertEquals(200, response.getStatusCodeValue());
        verify(catalogService).getProductById(1L);
    }

    @Test
    void testUpdateProductStock() {
        UpdateProductStockDTO dto = new UpdateProductStockDTO(1L, 50);
        ResponseProductStockEvent event = new ResponseProductStockEvent(1L, 50);
        when(catalogService.updateProductStockDTO(1L, dto)).thenReturn(event);

        ResponseEntity<ResponseProductStockEvent> response = controller.updateProductStock(1L, dto);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals(event, response.getBody());
        verify(catalogService).updateProductStockDTO(1L, dto);
    }

    @Test
    void testGetProductStock() {
        ResponseProductStockEvent event = new ResponseProductStockEvent(1L, 50);
        when(catalogService.getProductStock(1L)).thenReturn(event);

        ResponseEntity<ResponseProductStockEvent> response = controller.getProductStock(1L);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals(event, response.getBody());
        verify(catalogService).getProductStock(1L);
    }

    @Test
    void testGetProductStock_NotFound() {
        when(catalogService.getProductStock(1L)).thenReturn(null);

        ResponseEntity<ResponseProductStockEvent> response = controller.getProductStock(1L);

        assertEquals(404, response.getStatusCodeValue());
        verify(catalogService).getProductStock(1L);
    }


    @Test
    void testCreateCategory() {
        CreateCategoryDTO dto = new CreateCategoryDTO();
        ResponseCategoryDTO responseDto = dummyCategory();
        when(catalogService.createCategory(dto)).thenReturn(responseDto);

        ResponseEntity<ResponseCategoryDTO> response = controller.createCategory(dto);

        assertEquals(201, response.getStatusCodeValue());
        assertEquals(responseDto, response.getBody());
        verify(catalogService).createCategory(dto);
    }

    @Test
    void testSearch() {
        ResponseSearchResultDTO result = new ResponseSearchResultDTO(
                List.of(dummyProduct()),
                List.of(dummyCategory()),
                List.of(dummyMixture()),
                List.of(dummyTag())
        );
        when(elasticsearchService.search("query")).thenReturn(result);

        ResponseSearchResultDTO response = controller.search("query");

        assertEquals(result, response);
        verify(elasticsearchService).search("query");
    }
}
