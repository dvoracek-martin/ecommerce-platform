package com.dvoracekmartin.userservice.application.service;

import com.dvoracekmartin.userservice.application.dto.*;
import com.dvoracekmartin.userservice.application.event.publisher.UserEventPublisher;
import com.dvoracekmartin.userservice.domain.model.User;
import com.dvoracekmartin.userservice.domain.repository.UserRepository;
import com.dvoracekmartin.userservice.domain.service.PasswordResetService;
import com.dvoracekmartin.userservice.domain.service.UserActivationService;
import com.dvoracekmartin.userservice.domain.utils.ActivationException;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserAuthenticationService userAuthenticationService;
    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final UserEventPublisher userEventPublisher;
    private final JavaMailSender mailSender;
    private final PasswordResetService passwordResetService;
    private final UserActivationService userActivationService;

    @Value("${global.mailserver.reset-link.subject}")
    private String resetUserPasswordSubject;
    @Value("${global.mailserver.reset-link.body-first-part}")
    private String resetUserPasswordBodyFirstPart;
    @Value("${global.mailserver.reset-link.body-second-part}")
    private String resetUserPasswordBodySecondPart;
    @Value("${global.mailserver.reset-link.url}")
    private String resetUserPasswordURL;

    @Value("${global.mailserver.activation-link.subject:Account Activation}")
    private String activationEmailSubject;
    @Value("${global.mailserver.activation-link.body-first-part:Please click the following link to activate your account: }")
    private String activationEmailBodyFirstPart;
    @Value("${global.mailserver.activation-link.body-second-part:}")
    private String activationEmailBodySecondPart;
    @Value("${global.mailserver.activation-link.url:http://localhost:4200/activate?token=}")
    private String activationURL;

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

        Response keycloakResponse = userAuthenticationService.createUser(createUserDTO, false);
        int status = keycloakResponse.getStatus();
        log.info("Keycloak user creation responded with status: {}", status);

        if (status == Response.Status.CREATED.getStatusCode()) {
            String userId = parseUserIdFromLocation(keycloakResponse.getHeaderString("Location"));
            log.debug("Parsed new user ID: {}", userId);

            // Generate activation token
            String activationToken = userActivationService.generateActivationToken(createUserDTO.email());
            log.info("Generated activation token for user {}: {}", createUserDTO.email(), activationToken);

            // Save user as inactive with activation token
            User user = userMapper.createUserDTOToUser(createUserDTO, userId);
            user.setActive(false);
            user.setEmailVerified(false);
            user.setActivationToken(activationToken);
            user.setActivationTokenExpiry(LocalDateTime.now().plusHours(24));

            User savedUser = userRepository.save(user);
            log.info("User {} saved in local DB as inactive", savedUser.getUsername());

            // Send activation email
            sendActivationEmail(savedUser.getEmail(), activationToken);
            log.info("Activation email sent to {}", savedUser.getEmail());

            // Publish user created event
            userEventPublisher.publishUserCreatedEvent(
                    savedUser.getId(),
                    savedUser.getUsername(),
                    savedUser.getEmail(),
                    createUserDTO.preferredLanguageId(),
                    false
            );

            return userMapper.userToResponseUserDTO(savedUser, status);
        }

        log.error("Failed to create user {}. Keycloak responded with status: {}", createUserDTO.username(), status);
        return userMapper.createUserDTOToResponseUserDTO(createUserDTO, status);
    }

    @Override
    public String activateUser(String token) {
        String email = userActivationService.getEmailByToken(token);
        if (!userActivationService.isTokenValid(token)) {
            throw new ActivationException("Activation token is invalid or expired");
        }
        log.info("Activating user with email: {}", email);

        Optional<User> userOptional = userRepository.findByUsername(email);
        if (userOptional.isEmpty()) {
            log.warn("User with email {} doesn't exist!", email);
            throw new ActivationException("User not found");
        }

        User user = userOptional.get();

        // Activate user in Keycloak
        String userId = userAuthenticationService.getUserIdByUsername(email);
        Response keycloakResponse = userAuthenticationService.activateUser(userId);
        int status = keycloakResponse.getStatus();

        if (status == Response.Status.NO_CONTENT.getStatusCode() || status == Response.Status.OK.getStatusCode()) {
            // Update user as active and verified
            user.setActive(true);
            user.setEmailVerified(true);
            user.setActivationToken(null);
            user.setActivationTokenExpiry(null);
            userRepository.save(user);

            userActivationService.invalidateToken(token);

            log.info("User {} activated successfully", email);
            return "Account activated successfully. You can now log in.";
        } else {
            log.error("Failed to activate user in Keycloak. Status: {}", status);
            throw new ActivationException("Failed to activate account in authentication service");
        }
    }

    @Override
    public ResponseUserDTO updateUser(String userId, UpdateUserDTO updateUserDTO) {
        log.info("Updating user with ID: {}", userId);

        if (!userRepository.existsByUsername(updateUserDTO.username())) {
            log.warn("User with username {} does not exist", updateUserDTO.username());
            return userMapper.updateUserDTOToResponseUserDTO(updateUserDTO, Response.Status.CONFLICT.getStatusCode());
        }

        Response keycloakResponse = userAuthenticationService.updateUser(userId, updateUserDTO);
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
            return new ResponseUserDTO(userId, null, null, Response.Status.NOT_FOUND.getStatusCode(), false);
        }

        Response keycloakResponse = userAuthenticationService.deleteUser(userId);
        int status = keycloakResponse.getStatus();
        log.info("Keycloak deletion responded with status: {}", status);

        if (status == Response.Status.NO_CONTENT.getStatusCode()) {
            userRepository.delete(maybeUser.get());
            log.info("User with ID {} deleted successfully", userId);
            return userMapper.userToResponseUserDTO(maybeUser.get(), Response.Status.NO_CONTENT.getStatusCode());
        }

        log.error("Failed to delete user with ID {}. Status: {}", userId, status);
        return new ResponseUserDTO(userId, null, null, Response.Status.NOT_FOUND.getStatusCode(), false);
    }

    @Override
    public ResponseUserDTO updateUserPassword(String userId, UpdateUserPasswordDTO updateUserPasswordDTO) {
        log.info("Updating password for user with ID: {}", userId);

        if (userRepository.findById(userId).isEmpty()) {
            log.warn("User with ID {} not found for password update", userId);
            return userMapper.updateUserPasswordDTOToResponseUserDTO(updateUserPasswordDTO, Response.Status.NOT_FOUND.getStatusCode());
        }

        Response keycloakResponse = userAuthenticationService.updateUserPassword(userId, updateUserPasswordDTO);
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
        // Check if user exists
        Optional<User> userOptional = userRepository.findByUsername(updateUserPasswordDTO.email());
        if (userOptional.isEmpty()) {
            log.info("No user found with email: {}", updateUserPasswordDTO.email());
            return userMapper.updateUserDTOToResponseUserDTO(updateUserPasswordDTO, Response.Status.OK.getStatusCode());
        }

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

        Optional<User> userOptional = userRepository.findByUsername(email);
        if (userOptional.isEmpty()) {
            log.warn("User with email {} doesn't exist!", email);
            return ResponseEntity.notFound().build();
        }

        String userId = userAuthenticationService.getUserIdByUsername(email);
        log.debug("Found userId {} for email {}", userId, email);

        Response keycloakResponse = userAuthenticationService.resetPassword(userId, newPassword);
        int status = keycloakResponse.getStatus();
        log.info("Keycloak reset password responded with status: {}", status);

        passwordResetService.invalidateToken(token);
        return ResponseEntity.ok().body("Password has been reset successfully.");
    }

    @Override
    public void updateUserWithoutCredentials(UpdateUserDTO updateUserDTO) {
        String userId = updateUserDTO.id();
        log.info("Updating without Keycloak user with ID: {}", userId);

        if (!userRepository.existsByUsername(updateUserDTO.username())) {
            log.warn("User with username {} does not exist", updateUserDTO.username());
        }

        userAuthenticationService.addOrRevokeUserAccess(userId, updateUserDTO.active());
        userAuthenticationService.updateUserEmail(updateUserDTO);
        userRepository.save(userMapper.updateUserDTOToUser(updateUserDTO, userId));
        log.info("User with ID {} updated successfully", userId);
    }

    @Override
    public List<ResponseUserDTO> getAllUsers() {
        log.info("Fetching all users");
        return userRepository.findAll().stream().map(userMapper::userToResponseUserDTO).toList();
    }

    @Override
    public ResponseUserDTO getUserById(String userId) {
        log.info("Fetching user by ID: {}", userId);
        return userRepository.findById(userId).map(userMapper::userToResponseUserDTO).orElse(null);
    }

    private void sendActivationEmail(String email, String activationToken) {
        String activationLink = activationURL + activationToken;
        log.debug("Activation link: {}", activationLink);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(activationEmailSubject);
        message.setText(activationEmailBodyFirstPart + activationLink + activationEmailBodySecondPart);

        try {
            mailSender.send(message);
            log.info("Activation email sent to {}", email);
        } catch (Exception e) {
            log.error("Failed to send activation email to {}", email, e);
        }
    }
}