package com.dvoracekmartin.userservice.web.controller.v1;

import com.dvoracekmartin.userservice.application.dto.CreateUserDTO;
import com.dvoracekmartin.userservice.application.dto.ResponseUserDTO;
import com.dvoracekmartin.userservice.application.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/v1/admin")
@PreAuthorize("hasRole('user_admin')")
public class UserAdminControllerV1 {

    private static final Logger LOG = LoggerFactory.getLogger(UserAdminControllerV1.class);
    private final UserService userService;

    public UserAdminControllerV1(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/all")
    public List<ResponseUserDTO> getAllUsers() {
        LOG.info("Admin fetching all users");
        return userService.getAllUsers();
    }

    @PostMapping("/create")
    public ResponseEntity<ResponseUserDTO> createUser(@Valid @RequestBody CreateUserDTO createUserDTO) {
        LOG.info("Admin creating user");
        ResponseUserDTO response = userService.createUser(createUserDTO);
        return ResponseEntity.status(response.statusCode()).body(response);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId) {
        LOG.info("Admin deleting user: {}", userId);
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }
}
