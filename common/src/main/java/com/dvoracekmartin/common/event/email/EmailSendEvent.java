package com.dvoracekmartin.common.event.email;

import com.dvoracekmartin.common.dto.email.EmailSendDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.List;

@EqualsAndHashCode()
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmailSendEvent {
    private String correlationId;
    private List<String> recipients;
    private EmailSendDTO emailDTO;
}
