package com.dvoracekmartin.userservice.web.controller.v1;

import com.dvoracekmartin.userservice.application.dto.*;
import com.dvoracekmartin.userservice.application.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/v1")
@Validated
public class UserControllerV1 {

    private static final Logger LOG = LoggerFactory.getLogger(UserControllerV1.class);
    private final UserService userService;

    public UserControllerV1(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ResponseUserDTO> getUserById(@PathVariable String userId) {
        LOG.debug("Fetching user: {}", userId);
        ResponseUserDTO dto = userService.getUserById(userId);
        if (dto == null) {
            LOG.warn("User not found: {}", userId);
            return ResponseEntity.notFound().build();
        }
        return toResponse(dto);
    }

    @PostMapping
    public ResponseEntity<ResponseUserDTO> createUser(@Valid @RequestBody CreateUserDTO createUserDTO) {
        LOG.info("Creating new user");
        return toResponse(userService.createUser(createUserDTO));
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('user_client')")
    public ResponseEntity<ResponseUserDTO> updateUser(@PathVariable String userId,
                                                      @Valid @RequestBody UpdateUserDTO updateUserDTO) {
        checkAccessOrThrow(userId);
        LOG.info("Updating user: {}", userId);
        return toResponse(userService.updateUser(userId, updateUserDTO));
    }

    @PutMapping("/{userId}/password")
    @PreAuthorize("hasRole('user_client')")
    public ResponseEntity<ResponseUserDTO> updateUserPassword(@PathVariable String userId,
                                                              @Valid @RequestBody UpdateUserPasswordDTO updateUserPasswordDTO) {
        checkAccessOrThrow(userId);
        LOG.info("Updating password for user: {}", userId);
        return toResponse(userService.updateUserPassword(userId, updateUserPasswordDTO));
    }

    @PostMapping("/forgot-password")
    @PreAuthorize("hasRole('user_client')")
    public ResponseEntity<ResponseUserDTO> forgotUserPassword(@Valid @RequestBody ForgotPasswordDTO dto) {
        LOG.info("User forgot password: {}", dto.email());
        return toResponse(userService.forgotUserPassword(dto));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordDTO dto) {
        LOG.info("Resetting password with token (truncated): {}...", dto.token().substring(0, 6));
        return userService.resetUserPassword(dto.token(), dto.newPassword());
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId) {
        checkAccessOrThrow(userId);
        LOG.info("Deleting user: {}", userId);
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    // --- Private Utility Methods ---

    private static boolean currentUserDoesntMatch(String userId) {
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean mismatch = !currentUserId.equals(userId);
        if (mismatch) {
            LOG.debug("ID mismatch: path={} vs auth={}", userId, currentUserId);
        }
        return mismatch;
    }

    private void checkAccessOrThrow(String userId) {
        if (currentUserDoesntMatch(userId)) {
            LOG.warn("Access denied for user: {}", userId);
            throw new AccessDeniedException("You are not allowed to access this user");
        }
    }

    private ResponseEntity<ResponseUserDTO> toResponse(ResponseUserDTO response) {
        return ResponseEntity.status(response.statusCode()).body(response);
    }
}
