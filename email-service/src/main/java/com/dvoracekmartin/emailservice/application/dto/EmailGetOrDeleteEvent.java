package com.dvoracekmartin.emailservice.application.dto;

import com.dvoracekmartin.common.event.email.EmailObjectsEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode()
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmailGetOrDeleteEvent {
    private EmailObjectsEnum objectType;
    private Long entityId;
}
