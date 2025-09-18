package com.dvoracekmartin.userservice.web.controller.v1;

import com.dvoracekmartin.userservice.application.dto.CreateUserDTO;
import com.dvoracekmartin.userservice.application.dto.ResponseUserDTO;
import com.dvoracekmartin.userservice.application.dto.UpdateUserDTO;
import com.dvoracekmartin.userservice.application.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/v1/admin")
@PreAuthorize("hasRole('user_admin')")
@RequiredArgsConstructor
@Slf4j
public class UserAdminControllerV1 {

    private final UserService userService;

    @GetMapping("/all")
    public List<ResponseUserDTO> getAllUsers() {
        log.info("Admin fetching all users");
        return userService.getAllUsers();
    }

    @PostMapping("/create")
    public ResponseEntity<ResponseUserDTO> createUser(@Valid @RequestBody CreateUserDTO createUserDTO) {
        log.info("Admin creating user");
        ResponseUserDTO response = userService.createUser(createUserDTO);
        return ResponseEntity.status(response.statusCode()).body(response);
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('user_client')")
    public ResponseEntity<ResponseUserDTO> updateUser(@PathVariable String userId,
                                                      @Valid @RequestBody UpdateUserDTO updateUserDTO) {
        log.info("Updating user: {}", userId);
        ResponseUserDTO response = userService.updateUser(userId, updateUserDTO);
        return ResponseEntity.status(response.statusCode()).body(response);
    }
}
