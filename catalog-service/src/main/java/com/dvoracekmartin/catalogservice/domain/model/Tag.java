package com.dvoracekmartin.catalogservice.domain.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @JsonBackReference
    @ManyToMany(mappedBy = "tags")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Product> products;

    @JsonBackReference
    @EqualsAndHashCode.Exclude
    @ManyToMany(mappedBy = "tags")
    private List<Category> categories;

    @JsonBackReference
    @EqualsAndHashCode.Exclude
    @ManyToMany(mappedBy = "tags")
    private List<Mixture> mixtures;
}
