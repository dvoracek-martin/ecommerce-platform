package com.dvoracekmartin.catalogservice.domain.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Mixture extends BaseEntity {

    @Column(nullable = false)
    @NotNull
    private Double price;

    private Double weightGrams;

    @ManyToMany
    @JsonManagedReference
    @JoinTable(
            name = "mixture_products",
            joinColumns = @JoinColumn(name = "mixture_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    private List<Product> products;

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
