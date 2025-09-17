package com.dvoracekmartin.common.dto.base;

import com.dvoracekmartin.common.dto.media.MediaDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public abstract class BaseUpdateOrResponseDTO {

    @NotNull
    private Long id;

    @NotBlank
    private String name;

    private String description;

    private int priority;

    private boolean active;

    private List<MediaDTO> media;
}
