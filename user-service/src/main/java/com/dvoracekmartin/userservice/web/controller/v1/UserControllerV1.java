package com.dvoracekmartin.userservice.web.controller.v1;

import com.dvoracekmartin.userservice.application.dto.*;
import com.dvoracekmartin.userservice.application.service.UserService;
import com.dvoracekmartin.userservice.domain.service.PasswordResetService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/v1")
public class UserControllerV1 {

    private final UserService userService;
    private final PasswordResetService passwordResetService;

    public UserControllerV1(UserService userService, PasswordResetService passwordResetService) {
        this.userService = userService;
        this.passwordResetService = passwordResetService;
    }

    // -------------------------------------------------------------
    // GET a user by ID
    // -------------------------------------------------------------
    @GetMapping("/{userId}")
    public ResponseEntity<ResponseUserDTO> getUserById(@PathVariable String userId) {
        ResponseUserDTO dto = userService.getUserById(userId);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/")
    public ResponseEntity<ResponseUserDTO> createUser(@RequestBody CreateUserDTO createUserDTO) {
        ResponseUserDTO response = userService.createUser(createUserDTO);
        return ResponseEntity.status(response.statusCode()).body(response);
    }

    // -------------------------------------------------------------
    // UPDATE user (self-service)
    // -------------------------------------------------------------
    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('user_client')")
    public ResponseEntity<ResponseUserDTO> updateUser(@PathVariable String userId,
                                                      @RequestBody UpdateUserDTO updateUserDTO) {
        if (currentUserDoesntMatch(userId)) {
            throw new AccessDeniedException("You are not allowed to update this user");
        }
        ResponseUserDTO response = userService.updateUser(userId, updateUserDTO);
        return ResponseEntity.status(response.statusCode()).body(response);
    }

    // -------------------------------------------------------------
    // UPDATE user's password (self-service)
    // -------------------------------------------------------------
    @PutMapping("/{userId}/password")
    @PreAuthorize("hasRole('user_client')")
    public ResponseEntity<ResponseUserDTO> updateUserPassword(@PathVariable String userId,
                                                              @RequestBody UpdateUserPasswordDTO updateUserPasswordDTO) {
        if (currentUserDoesntMatch(userId)) {
            throw new AccessDeniedException("You are not allowed to update this user");
        }
        ResponseUserDTO response = userService.updateUserPassword(userId, updateUserPasswordDTO);
        return ResponseEntity.status(response.statusCode()).body(response);
    }

    // -------------------------------------------------------------
    // forgotten user's password (self-service)
    // -------------------------------------------------------------
    @PostMapping("/forgot-password")
    @PreAuthorize("hasRole('user_client')")
    public ResponseEntity<ResponseUserDTO> forgotUserPassword(@RequestBody ForgotPasswordDTO updateUserPasswordDTO) {
        ResponseUserDTO response = userService.forgotUserPassword(updateUserPasswordDTO);
        return ResponseEntity.status(response.statusCode()).body(response);
    }

    // Endpoint to reset the password
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordDTO dto) {
        return userService.resetUserPassword(dto.token(), dto.newPassword());
    }

    // -------------------------------------------------------------
    // DELETE user (self-service)
    // -------------------------------------------------------------
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId) {
        if (currentUserDoesntMatch(userId)) {
            throw new AccessDeniedException("You are not allowed to delete this user");
        }
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------
    // GET ALL users (admin)
    // -------------------------------------------------------------
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('user_admin')")
    public List<ResponseUserDTO> getAllUsers() {
        return userService.getAllUsers();
    }

    // -------------------------------------------------------------
    // CREATE user (admin)
    // -------------------------------------------------------------
    @PostMapping("/admin/create")
    @PreAuthorize("hasRole('user_admin')")
    public ResponseEntity<ResponseUserDTO> createUserAdmin(@RequestBody CreateUserDTO createUserDTO) {
        ResponseUserDTO response = userService.createUser(createUserDTO);
        return ResponseEntity.status(response.statusCode()).body(response);
    }

    // -------------------------------------------------------------
    // DELETE user (admin)
    // -------------------------------------------------------------
    @DeleteMapping("/admin/{userId}")
    @PreAuthorize("hasRole('user_admin')")
    public ResponseEntity<Void> deleteUserAdmin(@PathVariable String userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------
    // Helper to compare path userId with the ID from the token
    // -------------------------------------------------------------
    private static boolean currentUserDoesntMatch(String userId) {
        String currentUserId = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return !currentUserId.equals(userId);
    }
}
