package com.dvoracekmartin.catalogservice.application.dto.base;

import com.dvoracekmartin.catalogservice.application.dto.media.MediaDTO;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public abstract class BaseUpdateOrResponseDTO {

    public BaseUpdateOrResponseDTO() {}

    @NotBlank
    private Long id;

    @NotBlank
    private String name;

    private String description;

    private int priority;

    private boolean active;

    private List<MediaDTO> media;
}
