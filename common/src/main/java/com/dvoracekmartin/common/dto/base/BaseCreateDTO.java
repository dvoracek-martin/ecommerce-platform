package com.dvoracekmartin.common.dto.base;

import com.dvoracekmartin.common.dto.media.MediaDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public abstract class BaseCreateDTO {

    @NotBlank
    @Size(min = 3)
    private String name;

    private String description;

    private int priority;

    private boolean active;

    private List<MediaDTO> media;

    @NotBlank
    private String url;
}
