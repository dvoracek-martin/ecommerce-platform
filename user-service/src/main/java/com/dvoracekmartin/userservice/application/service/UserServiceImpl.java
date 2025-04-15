package com.dvoracekmartin.userservice.application.service;

import com.dvoracekmartin.userservice.application.dto.*;
import com.dvoracekmartin.userservice.application.event.publisher.UserEventPublisher;
import com.dvoracekmartin.userservice.domain.model.User;
import com.dvoracekmartin.userservice.domain.repository.UserRepository;
import com.dvoracekmartin.userservice.domain.service.PasswordResetService;
import jakarta.servlet.ServletContext;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final KeycloakUserService keycloakUserService;
    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final UserEventPublisher userEventPublisher;
    private final JavaMailSender mailSender;
    private final PasswordResetService passwordResetService;
    private final ServletContext servletContext;

    @Value("${global.mailserver.reset-link.subject}")
    private String resetUserPasswordSubject;
    @Value("${global.mailserver.reset-link.body-first-part}")
    private String resetUserPasswordBodyFirstPart;
    @Value("${global.mailserver.reset-link.body-second-part}")
    private String resetUserPasswordBodySecondPart;
    @Value("${global.mailserver.reset-link.url}")
    private String resetUserPasswordURL;

    private static String parseUserIdFromLocation(String location) {
        return location.substring(location.lastIndexOf('/') + 1);
    }

    @Override
    public ResponseUserDTO createUser(CreateUserDTO createUserDTO) {
        log.info("Creating user with username: {}", createUserDTO.username());

        if (userRepository.existsByUsername(createUserDTO.username())) {
            log.warn("User with username {} already exists", createUserDTO.username());
            return userMapper.createUserDTOToResponseUserDTO(createUserDTO, Response.Status.CONFLICT.getStatusCode());
        }

        Response keycloakResponse = keycloakUserService.createUser(createUserDTO);
        int status = keycloakResponse.getStatus();
        log.info("Keycloak user creation responded with status: {}", status);

        if (status == Response.Status.CREATED.getStatusCode()) {
            String userId = parseUserIdFromLocation(keycloakResponse.getHeaderString("Location"));
            log.debug("Parsed new user ID: {}", userId);

            User savedUser = userRepository.save(userMapper.createUserDTOToUser(createUserDTO, userId));
            log.info("User {} saved in local DB", savedUser.getUsername());

            userEventPublisher.publishUserCreatedEvent(savedUser.getId(), savedUser.getUsername(), savedUser.getEmail());
            log.debug("Published user created event for userId: {}", savedUser.getId());

            return userMapper.userToResponseUserDTO(savedUser, status);
        }

        log.error("Failed to create user {}. Keycloak responded with status: {}", createUserDTO.username(), status);
        return userMapper.createUserDTOToResponseUserDTO(createUserDTO, status);
    }

    @Override
    public ResponseUserDTO updateUser(String userId, UpdateUserDTO updateUserDTO) {
        log.info("Updating user with ID: {}", userId);

        if (!userRepository.existsByUsername(updateUserDTO.username())) {
            log.warn("User with username {} does not exist", updateUserDTO.username());
            return userMapper.updateUserDTOToResponseUserDTO(updateUserDTO, Response.Status.CONFLICT.getStatusCode());
        }

        Response keycloakResponse = keycloakUserService.updateUser(userId, updateUserDTO);
        int status = keycloakResponse.getStatus();
        log.info("Keycloak update responded with status: {}", status);

        if (status == Response.Status.NO_CONTENT.getStatusCode()) {
            User updatedUser = userRepository.save(userMapper.updateUserDTOToUser(updateUserDTO, userId));
            log.info("User with ID {} updated successfully", userId);
            return userMapper.userToResponseUserDTO(updatedUser, status);
        }

        log.error("Failed to update user with ID {}. Status: {}", userId, status);
        return userMapper.updateUserDTOToResponseUserDTO(updateUserDTO, status);
    }

    @Override
    public ResponseUserDTO deleteUser(String userId) {
        log.info("Deleting user with ID: {}", userId);

        Optional<User> maybeUser = userRepository.findById(userId);
        if (maybeUser.isEmpty()) {
            log.warn("User with ID {} not found", userId);
            return new ResponseUserDTO(userId, null, null, Response.Status.NOT_FOUND.getStatusCode());
        }

        Response keycloakResponse = keycloakUserService.deleteUser(userId);
        int status = keycloakResponse.getStatus();
        log.info("Keycloak deletion responded with status: {}", status);

        if (status == Response.Status.NO_CONTENT.getStatusCode()) {
            userRepository.delete(maybeUser.get());
            log.info("User with ID {} deleted successfully", userId);
            return userMapper.userToResponseUserDTO(maybeUser.get(), Response.Status.NO_CONTENT.getStatusCode());
        }

        log.error("Failed to delete user with ID {}. Status: {}", userId, status);
        return new ResponseUserDTO(userId, null, null, Response.Status.NOT_FOUND.getStatusCode());
    }

    @Override
    public ResponseUserDTO updateUserPassword(String userId, UpdateUserPasswordDTO updateUserPasswordDTO) {
        log.info("Updating password for user with ID: {}", userId);

        if (userRepository.findById(userId).isEmpty()) {
            log.warn("User with ID {} not found for password update", userId);
            return userMapper.updateUserPasswordDTOToResponseUserDTO(updateUserPasswordDTO, Response.Status.NOT_FOUND.getStatusCode());
        }

        Response keycloakResponse = keycloakUserService.updateUserPassword(userId, updateUserPasswordDTO);
        int status = keycloakResponse.getStatus();
        log.info("Keycloak password update responded with status: {}", status);

        if (status == Response.Status.NO_CONTENT.getStatusCode()) {
            log.info("Password updated successfully for user {}", userId);
            return userMapper.updateUserPasswordDTOToResponseUserDTO(updateUserPasswordDTO, Response.Status.OK.getStatusCode());
        }

        return userMapper.updateUserPasswordDTOToResponseUserDTO(updateUserPasswordDTO, keycloakResponse.getStatus());
    }

    @Override
    public ResponseUserDTO forgotUserPassword(ForgotPasswordDTO updateUserPasswordDTO) {
        log.info("Processing forgot password for email: {}", updateUserPasswordDTO.email());

        String token = passwordResetService.generateResetToken(updateUserPasswordDTO.email());
        log.debug("Reset token generated for email {}: {}", updateUserPasswordDTO.email(), token);

        String resetLink = resetUserPasswordURL + token;
        log.debug("Reset link: {}", resetLink);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(updateUserPasswordDTO.email());
        message.setSubject(resetUserPasswordSubject);
        message.setText(resetUserPasswordBodyFirstPart + resetLink + resetUserPasswordBodySecondPart);

        try {
            mailSender.send(message);
            log.info("Password reset email sent to {}", updateUserPasswordDTO.email());
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", updateUserPasswordDTO.email(), e);
        }

        return userMapper.updateUserDTOToResponseUserDTO(updateUserPasswordDTO, Response.Status.OK.getStatusCode());
    }

    @Override
    public ResponseEntity<String> resetUserPassword(String token, String newPassword) {
        String email = passwordResetService.getEmailByToken(token);
        if (!passwordResetService.isTokenValid(token)) {
            return ResponseEntity.badRequest().body("Token is invalid or expired");
        }
        log.info("Resetting password for email: {}", email);

        if (userRepository.findByUsername(email) == null) {
            log.warn("User with email {} doesn't exist!", email);
            return ResponseEntity.notFound().build();
        }

        String userId = keycloakUserService.getUserIdByUsername(email);
        log.debug("Found userId {} for email {}", userId, email);

        Response keycloakResponse = keycloakUserService.resetPassword(userId, newPassword);
        int status = keycloakResponse.getStatus();
        log.info("Keycloak reset password responded with status: {}", status);

        passwordResetService.invalidateToken(token);
        return ResponseEntity.ok().body("Password has been reset successfully.");
    }

    @Override
    public List<ResponseUserDTO> getAllUsers() {
        log.info("Fetching all users");
        return userRepository.findAll().stream()
                .map(userMapper::userToResponseUserDTO)
                .toList();
    }

    @Override
    public ResponseUserDTO getUserById(String userId) {
        log.info("Fetching user by ID: {}", userId);
        return userRepository.findById(userId)
                .map(userMapper::userToResponseUserDTO)
                .orElse(null);
    }
}
