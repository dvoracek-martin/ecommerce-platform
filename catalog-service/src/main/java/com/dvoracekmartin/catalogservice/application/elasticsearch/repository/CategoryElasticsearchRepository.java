package com.dvoracekmartin.catalogservice.application.elasticsearch.repository;

import com.dvoracekmartin.catalogservice.application.elasticsearch.document.CategoryDocument;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

@Lazy
public interface CategoryElasticsearchRepository extends ElasticsearchRepository<CategoryDocument, String> {
    List<CategoryDocument> findByNameContainingIgnoreCase(String name);
    List<CategoryDocument> findByDescriptionContainingIgnoreCase(String description);
    List<CategoryDocument> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description);
}
