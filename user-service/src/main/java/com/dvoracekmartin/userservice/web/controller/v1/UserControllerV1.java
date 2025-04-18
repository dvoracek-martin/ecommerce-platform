package com.dvoracekmartin.userservice.web.controller.v1;

import com.dvoracekmartin.userservice.application.dto.*;
import com.dvoracekmartin.userservice.application.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/v1")
@Validated
@RequiredArgsConstructor
@Slf4j
public class UserControllerV1 {

    private final UserService userService;

    @GetMapping("/{userId}")
    public ResponseEntity<ResponseUserDTO> getUserById(@PathVariable String userId) {
        log.debug("Fetching user: {}", userId);
        ResponseUserDTO dto = userService.getUserById(userId);
        if (dto == null) {
            log.warn("User not found: {}", userId);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.status(dto.statusCode()).body(dto);
    }

    @PostMapping("/create")
    public ResponseEntity<ResponseUserDTO> createUser(@Valid @RequestBody CreateUserDTO createUserDTO) {
        log.info("Creating new user");
        ResponseUserDTO response = userService.createUser(createUserDTO);
        return ResponseEntity.status(response.statusCode()).body(response);
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('user_client')")
    public ResponseEntity<ResponseUserDTO> updateUser(@PathVariable String userId,
                                                      @Valid @RequestBody UpdateUserDTO updateUserDTO) {
        checkAccessOrThrow(userId);
        log.info("Updating user: {}", userId);
        ResponseUserDTO response = userService.updateUser(userId, updateUserDTO);
        return ResponseEntity.status(response.statusCode()).body(response);
    }

    @PutMapping("/{userId}/password")
    @PreAuthorize("hasRole('user_client')")
    public ResponseEntity<ResponseUserDTO> updateUserPassword(@PathVariable String userId,
                                                              @Valid @RequestBody UpdateUserPasswordDTO updateUserPasswordDTO) {
        checkAccessOrThrow(userId);
        log.info("Updating password for user: {}", userId);
        ResponseUserDTO response = userService.updateUserPassword(userId, updateUserPasswordDTO);
        return ResponseEntity.status(response.statusCode()).body(response);
    }

    @PostMapping("/forgot-password")
    @PreAuthorize("hasRole('user_client')")
    public ResponseEntity<ResponseUserDTO> forgotUserPassword(@Valid @RequestBody ForgotPasswordDTO dto) {
        log.info("User forgot password: {}", dto.email());
        ResponseUserDTO response = userService.forgotUserPassword(dto);
        return ResponseEntity.status(response.statusCode()).body(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordDTO dto) {
        log.info("Resetting password with token (truncated): {}...", dto.token().substring(0, 6));
        return userService.resetUserPassword(dto.token(), dto.newPassword());
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId) {
        checkAccessOrThrow(userId);
        log.info("Deleting user: {}", userId);
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    private boolean currentUserDoesntMatch(String userId) {
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean mismatch = !currentUserId.equals(userId);
        if (mismatch) {
            log.debug("ID mismatch: path={} vs auth={}", userId, currentUserId);
        }
        return mismatch;
    }

    private void checkAccessOrThrow(String userId) {
        if (currentUserDoesntMatch(userId)) {
            log.warn("Access denied for user: {}", userId);
            throw new AccessDeniedException("You are not allowed to access this user");
        }
    }
}
