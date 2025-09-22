package com.dvoracek.configurationservice.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "theme")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Theme {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    String name;

    @Column(nullable = false)
    String definition;
}
