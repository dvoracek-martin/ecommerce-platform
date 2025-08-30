package com.dvoracekmartin.catalogservice.domain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@MappedSuperclass
@Data
@NoArgsConstructor
@AllArgsConstructor
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
    private List<String> imageUrl;
}
