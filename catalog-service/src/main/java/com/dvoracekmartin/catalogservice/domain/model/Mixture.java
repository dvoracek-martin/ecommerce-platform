package com.dvoracekmartin.catalogservice.domain.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Mixture {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "product_mixture_id_generator")
    private Long id;

    @Column(nullable = false)
    @Size(min = 3, message = "Name must be at least 3 characters long")
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @ElementCollection
    @CollectionTable(name = "mixture_images", joinColumns = @JoinColumn(name = "mixture_id"))
    @Column(name = "image_url", length = 512)
    private List<String> images;

    @ManyToMany
    @JsonManagedReference
    @JoinTable(
            name = "mixture_products",
            joinColumns = @JoinColumn(name = "mixture_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    private List<Product> products; // The products that make up the mixture

    @Column(nullable = false)
    private String intendedUse;

    @Column(nullable = false)
    private String blendingInstructions;

    @Column(nullable = false)
    private String benefits;

    @Column(columnDefinition = "TEXT")
    private String medicinalUse;

    @Column(nullable = false)
    private Double totalWeightGrams;


    @Column(nullable = false)
    private boolean isCustomizable;

    @Column(columnDefinition = "TEXT")
    private String customizationOptions;

    @ManyToMany
    @JsonManagedReference
    @JoinTable(
            name = "mixture_categories",
            joinColumns = @JoinColumn(name = "mixture_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private List<Category> categories;

    @ManyToMany
    @JsonManagedReference
    @JoinTable(
            name = "mixture_tags",
            joinColumns = @JoinColumn(name = "mixture_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private List<Tag> tags;
}
