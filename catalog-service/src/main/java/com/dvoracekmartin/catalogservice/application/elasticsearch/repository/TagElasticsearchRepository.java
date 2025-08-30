package com.dvoracekmartin.catalogservice.application.elasticsearch.repository;

import com.dvoracekmartin.catalogservice.application.elasticsearch.document.TagDocument;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

@Lazy
public interface TagElasticsearchRepository extends ElasticsearchRepository<TagDocument, String> {
    List<TagDocument> findByNameContainingIgnoreCase(String name);

    List<TagDocument> findByDescriptionContainingIgnoreCase(String description);

    List<TagDocument> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description);
}
