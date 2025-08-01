package com.dvoracekmartin.catalogservice.application.elasticsearch.repository;

import com.dvoracekmartin.catalogservice.application.elasticsearch.document.CategoryDocument;
import com.dvoracekmartin.catalogservice.application.elasticsearch.document.ProductDocument;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

@Lazy
public interface ProductElasticsearchRepository extends ElasticsearchRepository<ProductDocument, String> {
    List<ProductDocument> findByNameContainingIgnoreCase(String name);
    List<ProductDocument> findByDescriptionContainingIgnoreCase(String description);
    List<ProductDocument> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description);
}
