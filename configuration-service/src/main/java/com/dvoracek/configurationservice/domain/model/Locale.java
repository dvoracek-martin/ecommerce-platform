package com.dvoracek.configurationservice.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "locale")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Locale {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    String languageCode;

    @Column(nullable = false)
    String regionCode;

    // To be adjusted only directly in the DB
    @Column
    private boolean inUse;
}
