package com.dvoracekmartin.userservice.web.controller.v1;

import com.dvoracekmartin.userservice.application.dto.CreateUserDTO;
import com.dvoracekmartin.userservice.application.dto.ResponseUserDTO;
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

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId) {
        log.info("Admin deleting user: {}", userId);
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }
}
