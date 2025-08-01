package com.dvoracekmartin.catalogservice.application.elasticsearch.service;

import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.ResponseProductDTO;
import com.dvoracekmartin.catalogservice.application.dto.search.ResponseSearchResultDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.ResponseTagDTO;
import com.dvoracekmartin.catalogservice.application.elasticsearch.ElasticsearchMapper;
import com.dvoracekmartin.catalogservice.application.elasticsearch.document.CategoryDocument;
import com.dvoracekmartin.catalogservice.application.elasticsearch.document.MixtureDocument;
import com.dvoracekmartin.catalogservice.application.elasticsearch.document.ProductDocument;
import com.dvoracekmartin.catalogservice.application.elasticsearch.document.TagDocument;
import com.dvoracekmartin.catalogservice.application.elasticsearch.repository.CategoryElasticsearchRepository;
import com.dvoracekmartin.catalogservice.application.elasticsearch.repository.MixtureElasticsearchRepository;
import com.dvoracekmartin.catalogservice.application.elasticsearch.repository.ProductElasticsearchRepository;
import com.dvoracekmartin.catalogservice.application.elasticsearch.repository.TagElasticsearchRepository;
import com.dvoracekmartin.catalogservice.application.service.CatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ElasticsearchService {

    private final CategoryElasticsearchRepository categoryElasticsearchRepository;
    private final ProductElasticsearchRepository productsElasticsearchRepository;
    private final MixtureElasticsearchRepository mixtureElasticsearchRepository;
    private final TagElasticsearchRepository tagElasticsearchRepository;
    private final ElasticsearchMapper elasticsearchMapper;
    private final CatalogService catalogService;

    public void indexAll() {
        List<ResponseCategoryDTO> categories = catalogService.getAllCategories();
        List<CategoryDocument> categoryDocs = categories.stream().map(elasticsearchMapper::mapResponseCategoryDTOToCategoryDocument).toList();
        categoryElasticsearchRepository.saveAll(categoryDocs);

        List<ProductDocument> products = catalogService.getAllProducts()
                .stream()
                .map(elasticsearchMapper::mapResponseProductDTOToProductDocument)
                .toList();

        productsElasticsearchRepository.saveAll(products);

        List<ResponseMixtureDTO> mixtures = catalogService.getAllMixtures();
        List<MixtureDocument> mixtureDocs = mixtures.stream()
                .map(elasticsearchMapper::mapResponseMixtureDTOToMixtureDocument)
                .toList();
        mixtureElasticsearchRepository.saveAll(mixtureDocs);

        List<ResponseTagDTO> tags = catalogService.getAllTags();
        List<TagDocument> tagDocs = tags.stream()
                .map(elasticsearchMapper::mapResponseTagDTOToTagDocument)
                .toList();
        tagElasticsearchRepository.saveAll(tagDocs);
    }

    public ResponseSearchResultDTO search(String query) {
        List<ResponseCategoryDTO> categories = categoryElasticsearchRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query)
                .stream()
                .map(this::toResponseCategoryDTO)
                .toList();

        List<ResponseProductDTO> products = productsElasticsearchRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query)
                .stream()
                .map(this::toResponseProductDTO)
                .toList();

        List<ResponseMixtureDTO> mixtures = mixtureElasticsearchRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query)
                .stream()
                .map(this::toResponseMixtureDTO)
                .toList();

        List<ResponseTagDTO> tags = tagElasticsearchRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query)
                .stream()
                .map(this::toResponseTagDTO)
                .toList();


        return new ResponseSearchResultDTO(products, categories, mixtures, tags);
    }


    private ResponseCategoryDTO toResponseCategoryDTO(CategoryDocument doc) {
        return elasticsearchMapper.mapCategoryDocumentToResponseCategoryDTO(doc);
    }

    private ResponseProductDTO toResponseProductDTO(ProductDocument doc) {
        return elasticsearchMapper.mapProductDocumentToResponseProductDTO(doc);
    }


    private ResponseMixtureDTO toResponseMixtureDTO(MixtureDocument doc) {
        return elasticsearchMapper.mapMixtureDocumentToResponseMixtureDTO(doc);
    }

    private ResponseTagDTO toResponseTagDTO(TagDocument doc) {
        return elasticsearchMapper.mapTagDocumentToResponseTagDTO(doc);
    }
}
