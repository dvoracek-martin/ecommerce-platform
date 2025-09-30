package com.dvoracek.translationservice.domain.model;

import jakarta.persistence.*;
import lombok.*;

@EqualsAndHashCode()
@MappedSuperclass
@Data
public class BaseTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "locale", nullable = false, length = 5, columnDefinition = "TEXT")
    private String locale;

    @Column(name = "name", nullable = false, columnDefinition = "TEXT")
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "url", columnDefinition = "TEXT")
    private String url;
}
