package com.dvoracek.configurationservice.web.controller.v1;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/configuration/v1")
@Validated
@RequiredArgsConstructor
@Slf4j
public class AppSettingsControllerV1 {

}
