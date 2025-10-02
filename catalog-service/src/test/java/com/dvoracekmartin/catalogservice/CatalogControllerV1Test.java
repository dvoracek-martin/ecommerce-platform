package com.dvoracekmartin.catalogservice;

import com.dvoracekmartin.catalogservice.application.dto.mixture.CreateMixtureDTO;
import com.dvoracekmartin.catalogservice.application.elasticsearch.service.ElasticsearchServiceImpl;
import com.dvoracekmartin.catalogservice.application.service.CatalogService;
import com.dvoracekmartin.catalogservice.application.service.media.MediaRetriever;
import com.dvoracekmartin.catalogservice.web.controller.v1.CatalogControllerV1;
import com.dvoracekmartin.catalogservice.application.dto.search.ResponseSearchResultDTO;
import com.dvoracekmartin.common.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.common.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.common.dto.product.ResponseProductDTO;
import com.dvoracekmartin.common.dto.tag.ResponseTagDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CatalogControllerV1Test {

    private CatalogService catalogService;
    private MediaRetriever mediaRetriever;
    private ElasticsearchServiceImpl elasticsearchService;
    private CatalogControllerV1 controller;

    @BeforeEach
    void setUp() {
        catalogService = mock(CatalogService.class);
        mediaRetriever = mock(MediaRetriever.class);
        elasticsearchService = mock(ElasticsearchServiceImpl.class);
        controller = new CatalogControllerV1(catalogService, mediaRetriever, elasticsearchService);
    }

    private MediaDTO dummyMedia() {
        return new MediaDTO("dummyBase64", "dummyKey", "image/jpeg");
    }

    private ResponseProductDTO dummyProduct() {
        return new ResponseProductDTO(
                1L,
                Map.of("en", new LocalizedField("name", "desc", "url")),
                1,
                true,
                List.of(dummyMedia()),
                List.of(),
                1L,
                10.0,
                100.0,
                true,
                true
        );
    }

    private ResponseMixtureDTO dummyMixture() {
        return new ResponseMixtureDTO(
                1L,
                "Mix",
                Map.of("en", new LocalizedField("mix", "desc", "url")),
                1,
                true,
                List.of(dummyMedia()),
                1L,
                List.of(dummyProduct()),
                List.of(1L),
                20.0,
                200.0,
                true
        );
    }

    private ResponseCategoryDTO dummyCategory() {
        return new ResponseCategoryDTO(
                1L,
                Map.of("en", new LocalizedField("category", "desc", "url")),
                1,
                true,
                List.of(dummyMedia()),
                List.of(),
                true
        );
    }

    private ResponseTagDTO dummyTag() {
        return new ResponseTagDTO(
                1L,
                Map.of("en", new LocalizedField("tag", "desc", "url")),
                1,
                true,
                List.of(dummyMedia()),
                List.of(dummyCategory()),
                List.of(dummyProduct()),
                List.of(dummyMixture())
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
    void testGetAllMixtures() {
        when(catalogService.getAllMixtures()).thenReturn(List.of(dummyMixture()));

        var mixtures = controller.getAllMixtures();

        assertEquals(1, mixtures.size());
        verify(catalogService).getAllMixtures();
    }

    @Test
    void testGetAllCategories() {
        when(catalogService.getAllCategories()).thenReturn(List.of(dummyCategory()));

        var categories = controller.getAllCategories();

        assertEquals(1, categories.size());
        verify(catalogService).getAllCategories();
    }

    @Test
    void testGetAllTags() {
        when(catalogService.getAllTags()).thenReturn(List.of(dummyTag()));

        var tags = controller.getAllTags();

        assertEquals(1, tags.size());
        verify(catalogService).getAllTags();
    }

    @Test
    void testSearch() {
        ResponseSearchResultDTO searchResult = new ResponseSearchResultDTO(
                List.of(dummyProduct()),
                List.of(dummyCategory()),
                List.of(dummyMixture()),
                List.of(dummyTag())
        );
        when(elasticsearchService.searchProductsAndMixtures("query")).thenReturn(searchResult);

        var result = controller.search("query");

        assertEquals(searchResult, result);
        verify(elasticsearchService).searchProductsAndMixtures("query");
    }

    @Test
    void testCreateMixture() {
        CreateMixtureDTO dto = new CreateMixtureDTO(
                "Mix", 1, true, List.of(dummyMedia()),
                1L, List.of(1L), List.of(1L), 20.0, 200.0, true, true
        );
        ResponseMixtureDTO responseDto = dummyMixture();
        when(catalogService.createMixture(dto)).thenReturn(responseDto);

        ResponseEntity<ResponseMixtureDTO> response = controller.createMixture(dto);

        assertEquals(201, response.getStatusCodeValue());
        assertEquals(responseDto, response.getBody());
        verify(catalogService).createMixture(dto);
    }
}
