package com.dvoracek.translationservice.domain.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "email_template_translation",
        uniqueConstraints = @UniqueConstraint(columnNames = {"entity_id", "locale"}))
@Getter
@Setter
@NoArgsConstructor
public class EmailTemplateTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "locale", nullable = false, length = 5, columnDefinition = "TEXT")
    private String locale;

    @Column(name = "subject", nullable = false, columnDefinition = "TEXT")
    private String subject;

    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    public EmailTemplateTranslation(Long entityId, String locale, String subject, String body) {
        this.entityId = entityId;
        this.locale = locale;
        this.subject = subject;
        this.body = body;
    }
}
