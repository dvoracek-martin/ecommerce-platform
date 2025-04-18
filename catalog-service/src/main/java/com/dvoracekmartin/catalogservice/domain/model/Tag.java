package com.dvoracekmartin.catalogservice.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @ManyToMany(mappedBy = "tags")
    private List<Product> products;

    @ManyToMany(mappedBy = "tags")
    private List<Category> categories;

    @ManyToMany(mappedBy = "tags")
    private List<Mixture> mixtures;
}
