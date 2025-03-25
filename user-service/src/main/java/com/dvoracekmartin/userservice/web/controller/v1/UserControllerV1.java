package com.dvoracekmartin.userservice.web.controller.v1;

import com.dvoracekmartin.userservice.application.dto.CreateUserDTO;
import com.dvoracekmartin.userservice.application.dto.ResponseUserDTO;
import com.dvoracekmartin.userservice.application.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/v1")
public class UserControllerV1 {
    private final UserService userService;

    public UserControllerV1(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{userId}")
    public ResponseUserDTO getUserById(@PathVariable String userId) {
        return userService.getUserById(userId);
    }

    @PostMapping("/")
    public ResponseEntity<ResponseUserDTO> createUser(@RequestBody CreateUserDTO createUserDTO) {
        ResponseUserDTO responseUserDTO = userService.createUser(createUserDTO);
        return ResponseEntity
                .status(responseUserDTO.statusCode())
                .body(responseUserDTO);
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('client_admin')")
    public List<ResponseUserDTO> getAllUsers() {
        return userService.getAllUsers();
    }

    @PostMapping("/admin/create")
    @PreAuthorize("hasRole('client_admin')")
    public void createUserAdmin(@RequestBody CreateUserDTO createUserDTO) {
        userService.createUser(createUserDTO);
    }
}
