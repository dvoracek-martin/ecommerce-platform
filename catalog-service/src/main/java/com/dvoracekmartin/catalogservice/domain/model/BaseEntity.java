package com.dvoracekmartin.catalogservice.domain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@MappedSuperclass
@Getter
@Setter
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @Size(min = 3, message = "Name must be at least 3 characters long")
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private int priority;

    @Column
    private boolean active;

    @ElementCollection
    @Column(name = "image_url", length = 512)
    private List<String> images;
}
