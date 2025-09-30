package com.dvoracekmartin.common.event.translation;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode()
@Data
@AllArgsConstructor
@NoArgsConstructor
public class LocalizedField {
    private String name;
    private String description;
    private String url;
}
