package com.dvoracekmartin.catalogservice.domain.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Mixture extends BaseEntity {

    @Column(nullable = false)
    @NotNull
    private BigDecimal price;

    @ManyToMany
    @JsonManagedReference
    @JoinTable(
            name = "mixture_products",
            joinColumns = @JoinColumn(name = "mixture_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    private List<Product> products;

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
