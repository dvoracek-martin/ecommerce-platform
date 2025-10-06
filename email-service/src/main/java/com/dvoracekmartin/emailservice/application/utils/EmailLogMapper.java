package com.dvoracekmartin.emailservice.application.utils;

import com.dvoracekmartin.emailservice.application.dto.ResponseEmailLogDTO;
import com.dvoracekmartin.emailservice.domain.model.EmailLog;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface EmailLogMapper {

    ResponseEmailLogDTO mapEmailLogToResponseEmailLogDTO(EmailLog emailLog);
}
