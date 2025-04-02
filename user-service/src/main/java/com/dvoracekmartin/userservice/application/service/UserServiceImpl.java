package com.dvoracekmartin.userservice.application.service;

import com.dvoracekmartin.userservice.application.dto.*;
import com.dvoracekmartin.userservice.application.events.UserEventPublisher;
import com.dvoracekmartin.userservice.domain.model.User;
import com.dvoracekmartin.userservice.domain.repository.UserRepository;
import com.dvoracekmartin.userservice.domain.service.PasswordResetService;
import jakarta.ws.rs.core.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private static final Logger LOG = LoggerFactory.getLogger(UserServiceImpl.class);

    private final KeycloakUserService keycloakUserService;
    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final UserEventPublisher userEventPublisher;
    private final JavaMailSender mailSender;
    private final PasswordResetService passwordResetService;

    public UserServiceImpl(KeycloakUserService keycloakUserService,
                           UserMapper userMapper,
                           UserRepository userRepository,
                           UserEventPublisher userEventPublisher,
                           JavaMailSender mailSender,
                           PasswordResetService passwordResetService) {
        this.keycloakUserService = keycloakUserService;
        this.userMapper = userMapper;
        this.userRepository = userRepository;
        this.userEventPublisher = userEventPublisher;
        this.mailSender = mailSender;
        this.passwordResetService = passwordResetService;
    }

    @Override
    public ResponseUserDTO createUser(CreateUserDTO createUserDTO) {
        LOG.info("Creating user with username: {}", createUserDTO.username());

        // 1) Check if user already exists
        if (userRepository.existsByUsername(createUserDTO.username())) {
            LOG.warn("User with username {} already exists", createUserDTO.username());
            return userMapper.createUserDTOToResponseUserDTO(
                    createUserDTO,
                    Response.Status.CONFLICT.getStatusCode()
            );
        }

        // 2) Create user in Keycloak
        Response keycloakResponse = keycloakUserService.createUser(createUserDTO);
        int status = keycloakResponse.getStatus();
        LOG.info("Keycloak user creation responded with status: {}", status);

        // 3) If creation succeeded in Keycloak, parse the new user ID
        if (status == Response.Status.CREATED.getStatusCode()) {
            String locationHeader = keycloakResponse.getHeaderString("Location");
            String newUserId = locationHeader.substring(locationHeader.lastIndexOf('/') + 1);
            LOG.debug("Parsed new user ID: {}", newUserId);

            // 4) Save user in our local DB
            User userEntity = userMapper.createUserDTOToUser(createUserDTO, newUserId);
            User savedUser = userRepository.save(userEntity);
            LOG.info("User {} saved in local DB", savedUser.getUsername());

            // 5) Publish user created event
            userEventPublisher.publishUserCreatedEvent(savedUser.getId(), savedUser.getUsername(), savedUser.getEmail());
            LOG.debug("Published user created event for userId: {}", savedUser.getId());

            return userMapper.userToResponseUserDTO(savedUser, status);
        }
        // 6) Otherwise, return a DTO with the error status
        LOG.error("Failed to create user {}. Keycloak responded with status: {}", createUserDTO.username(), status);
        return userMapper.createUserDTOToResponseUserDTO(createUserDTO, status);
    }

    @Override
    public ResponseUserDTO updateUser(String userId, UpdateUserDTO updateUserDTO) {
        LOG.info("Updating user with ID: {}", userId);

        // 1) Check if user to be updated exists in local DB or by username
        if (!userRepository.existsByUsername(updateUserDTO.username())) {
            LOG.warn("User with username {} does not exist", updateUserDTO.username());
            return userMapper.updateUserDTOToResponseUserDTO(
                    updateUserDTO,
                    Response.Status.CONFLICT.getStatusCode()
            );
        }

        // 2) Update user in Keycloak
        Response keycloakResponse = keycloakUserService.updateUser(userId, updateUserDTO);
        int status = keycloakResponse.getStatus();
        LOG.info("Keycloak update responded with status: {}", status);

        // 3) If Keycloak update succeeded, update local DB
        if (status == Response.Status.NO_CONTENT.getStatusCode()) {
            User userEntity = userMapper.updateUserDTOToUser(updateUserDTO, userId);
            User updatedUser = userRepository.save(userEntity);
            LOG.info("User with ID {} updated successfully", userId);
            return userMapper.userToResponseUserDTO(updatedUser, status);
        }

        // 4) Otherwise, return a DTO with the error status
        LOG.error("Failed to update user with ID {}. Status: {}", userId, status);
        return userMapper.updateUserDTOToResponseUserDTO(updateUserDTO, status);
    }

    @Override
    public ResponseUserDTO deleteUser(String userId) {
        LOG.info("Deleting user with ID: {}", userId);

        // 1) Check if user exists locally
        Optional<User> maybeUser = userRepository.findById(userId);
        if (maybeUser.isEmpty()) {
            LOG.warn("User with ID {} not found", userId);
            return new ResponseUserDTO(
                    userId,
                    null,
                    null,
                    Response.Status.NOT_FOUND.getStatusCode()
            );
        }

        // 2) Delete in Keycloak
        Response keycloakResponse = keycloakUserService.deleteUser(userId);
        int status = keycloakResponse.getStatus();
        LOG.info("Keycloak deletion responded with status: {}", status);

        // 3) If Keycloak deletion succeeded, remove from local DB
        if (status == Response.Status.NO_CONTENT.getStatusCode()) {
            userRepository.delete(maybeUser.get());
            LOG.info("User with ID {} deleted successfully", userId);
            return userMapper.userToResponseUserDTO(maybeUser.get(), Response.Status.NO_CONTENT.getStatusCode());
        }

        // 4) Otherwise, return a 404
        LOG.error("Failed to delete user with ID {}. Status: {}", userId, status);
        return new ResponseUserDTO(
                userId,
                null,
                null,
                Response.Status.NOT_FOUND.getStatusCode()
        );
    }

    @Override
    public ResponseUserDTO updateUserPassword(String userId, UpdateUserPasswordDTO updateUserPasswordDTO) {
        LOG.info("Updating password for user with ID: {}", userId);

        // 1) Check if user exists in local DB
        if (userRepository.findById(userId).isEmpty()) {
            LOG.warn("User with ID {} not found for password update", userId);
            return userMapper.updateUserPasswordDTOToResponseUserDTO(
                    updateUserPasswordDTO,
                    Response.Status.NOT_FOUND.getStatusCode()
            );
        }

        // 2) Update password in Keycloak
        Response keycloakResponse = keycloakUserService.updateUserPassword(userId, updateUserPasswordDTO);
        int status = keycloakResponse.getStatus();
        LOG.info("Keycloak password update responded with status: {}", status);

        // 3) Treat Keycloak's 204 as success but map to HTTP 200
        if (status == Response.Status.NO_CONTENT.getStatusCode()) {
            LOG.info("Password updated successfully for user {}", userId);
            return userMapper.updateUserPasswordDTOToResponseUserDTO(
                    updateUserPasswordDTO,
                    Response.Status.OK.getStatusCode()
            );
        }

        return userMapper.updateUserPasswordDTOToResponseUserDTO(
                updateUserPasswordDTO,
                keycloakResponse.getStatus()
        );
    }


    @Override
    public ResponseUserDTO forgotUserPassword(ForgotPasswordDTO updateUserPasswordDTO) {
        LOG.info("Processing forgot password for email: {}", updateUserPasswordDTO.email());

        // Generate a reset token for the provided email
        String token = passwordResetService.generateResetToken(updateUserPasswordDTO.email());
        LOG.debug("Reset token generated for email {}: {}", updateUserPasswordDTO.email(), token);

        // Build a reset link; adjust host/port as needed
        String resetLink = "http://localhost:4200/reset-password?token=" + token;
        LOG.debug("Reset link: {}", resetLink);

        // Compose the email
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(updateUserPasswordDTO.email());
        message.setSubject("Password Reset Request");
        message.setText("To reset your password, please click the following link:\n" + resetLink + "\n The link is valid for 1 hour.");

        // Send the email using MailHog SMTP settings
        try {
            mailSender.send(message);
            LOG.info("Password reset email sent to {}", updateUserPasswordDTO.email());
        } catch (Exception e) {
            LOG.error("Failed to send password reset email to {}", updateUserPasswordDTO.email(), e);
        }

        return userMapper.updateUserDTOToResponseUserDTO(updateUserPasswordDTO, Response.Status.OK.getStatusCode());
    }

    @Override
    public ResponseEntity<String> resetUserPassword(String token, String newPassword) {
        String email = passwordResetService.getEmailByToken(token);
        if (!passwordResetService.isTokenValid(token)) {
            return ResponseEntity.badRequest().body("Token is invalid or expired");
        }
        LOG.info("Resetting password for email: {}", email);

        if (userRepository.findByUsername(email) == null) {
            LOG.warn("User with email {} doesn't exist!", email);
            return ResponseEntity.notFound().build();
        }

        String userId = keycloakUserService.getUserIdByUsername(email);
        LOG.debug("Found userId {} for email {}", userId, email);

        Response keycloakResponse = keycloakUserService.resetPassword(userId, newPassword);
        int status = keycloakResponse.getStatus();
        LOG.info("Keycloak reset password responded with status: {}", status);

        // Invalidate the token after use
        passwordResetService.invalidateToken(token);
        // Always return 200 OK to prevent disclosing user existence details
        return ResponseEntity.ok().body("Password has been reset successfully.");
    }

    @Override
    public List<ResponseUserDTO> getAllUsers() {
        LOG.info("Fetching all users");
        return userRepository.findAll().stream()
                .map(userMapper::userToResponseUserDTO)
                .toList();
    }

    @Override
    public ResponseUserDTO getUserById(String userId) {
        LOG.info("Fetching user by ID: {}", userId);
        // Implementation TBD
        return null;
    }
}
