package com.dvoracekmartin.catalogservice.application.dto.base;

import com.dvoracekmartin.catalogservice.application.dto.media.MediaDTO;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public abstract class BaseUpdateOrResponseDTO {

    @NotBlank
    private Long id;

    @NotBlank
    private String name;

    private String description;

    private int priority;

    private boolean active;

    private List<MediaDTO> media;
}
