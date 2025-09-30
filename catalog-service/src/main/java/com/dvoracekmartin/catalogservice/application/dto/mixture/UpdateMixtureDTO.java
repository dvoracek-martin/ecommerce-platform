package com.dvoracekmartin.catalogservice.application.dto.mixture;

import com.dvoracekmartin.common.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
public class UpdateMixtureDTO extends BaseUpdateOrResponseDTO {
    private Double price;
    private Double weightGrams;
    private Long categoryId;
    private List<Long> productIds;
    private List<Long> tagIds;
    private boolean mixable;
    private boolean displayInProducts;
    private List<MediaDTO> media;

    // for user created mixtures
    @NotBlank
    @Size(min = 3)
    private String name;

    public UpdateMixtureDTO(Long id,
                            String name,
                            Map<String, LocalizedField> localizedFields,
                            int priority,
                            boolean active,
                            List<MediaDTO> media,
                            Long categoryId,
                            List<Long> productIds,
                            List<Long> tagIds,
                            Double price,
                            Double weightGrams,
                            boolean mixable,
                            boolean displayInProducts
    ) {
        super(id, localizedFields, priority, active, media);
        this.name = name;
        this.categoryId = categoryId;
        this.productIds = productIds;
        this.tagIds = tagIds;
        this.price = price;
        this.weightGrams = weightGrams;
        this.mixable = mixable;
        this.displayInProducts = displayInProducts;
    }
}
