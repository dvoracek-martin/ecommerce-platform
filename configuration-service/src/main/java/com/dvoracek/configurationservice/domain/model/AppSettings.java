package com.dvoracek.configurationservice.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Currency;
import java.util.List;

@EqualsAndHashCode()
@Entity
@Table(name = "app_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToMany
    @JoinTable(
            name = "app_settings_locales",
            joinColumns = @JoinColumn(name = "app_settings_id"),
            inverseJoinColumns = @JoinColumn(name = "locale_id")
    )
    private List<Locale> usedLocales;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "default_locale_id")
    private Locale defaultLocale;

    private Currency currency;

    private String theme;
    private LocalDateTime updatedAt;
}
