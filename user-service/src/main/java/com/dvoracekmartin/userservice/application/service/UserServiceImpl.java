package com.dvoracekmartin.userservice.application.service;

import com.dvoracekmartin.userservice.application.dto.*;
import com.dvoracekmartin.userservice.application.events.UserEventPublisher;
import com.dvoracekmartin.userservice.domain.model.User;
import com.dvoracekmartin.userservice.domain.repository.UserRepository;
import com.dvoracekmartin.userservice.domain.service.PasswordResetService;
import jakarta.ws.rs.core.Response;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final KeycloakUserService keycloakUserService;
    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final UserEventPublisher userEventPublisher;
    private final JavaMailSender mailSender;
    private final PasswordResetService passwordResetService;

    public UserServiceImpl(KeycloakUserService keycloakUserService,
                           UserMapper userMapper,
                           UserRepository userRepository, UserEventPublisher userEventPublisher, JavaMailSender mailSender, PasswordResetService passwordResetService) {
        this.keycloakUserService = keycloakUserService;
        this.userMapper = userMapper;
        this.userRepository = userRepository;
        this.userEventPublisher = userEventPublisher;
        this.mailSender = mailSender;
        this.passwordResetService = passwordResetService;
    }

    @Override
    public ResponseUserDTO createUser(CreateUserDTO createUserDTO) {
        // 1) Check if user already exists
        if (userRepository.existsByUsername(createUserDTO.username())) {
            return userMapper.createUserDTOToResponseUserDTO(
                    createUserDTO,
                    Response.Status.CONFLICT.getStatusCode()
            );
        }

        // 2) Create user in Keycloak
        Response keycloakResponse = keycloakUserService.createUser(createUserDTO);
        int status = keycloakResponse.getStatus();

        // 3) If creation succeeded in Keycloak, parse the new user ID
        if (status == Response.Status.CREATED.getStatusCode()) {
            String locationHeader = keycloakResponse.getHeaderString("Location");
            String newUserId = locationHeader.substring(locationHeader.lastIndexOf('/') + 1);

            // 4) Save user in our local DB
            User userEntity = userMapper.createUserDTOToUser(createUserDTO, newUserId);
            User savedUser = userRepository.save(userEntity);

            // 5) Publish user created event
            userEventPublisher.publishUserCreatedEvent(savedUser.getId(), savedUser.getUsername(), savedUser.getEmail());

            return userMapper.userToResponseUserDTO(savedUser, status);
        }
        // 6) Otherwise, return a DTO with the error status
        return userMapper.createUserDTOToResponseUserDTO(createUserDTO, status);
    }

    @Override
    public ResponseUserDTO updateUser(String userId, UpdateUserDTO updateUserDTO) {
        // 1) Check if user to be updated exists in local DB or by username
        if (!userRepository.existsByUsername(updateUserDTO.username())) {
            return userMapper.updateUserDTOToResponseUserDTO(
                    updateUserDTO,
                    Response.Status.CONFLICT.getStatusCode()
            );
        }

        // 2) Update user in Keycloak
        Response keycloakResponse = keycloakUserService.updateUser(userId, updateUserDTO);
        int status = keycloakResponse.getStatus();

        // 3) If Keycloak update succeeded, update local DB
        if (status == Response.Status.NO_CONTENT.getStatusCode()) {
            User userEntity = userMapper.updateUserDTOToUser(updateUserDTO, userId);
            User updatedUser = userRepository.save(userEntity);
            return userMapper.userToResponseUserDTO(updatedUser, status);
        }

        // 4) Otherwise, return a DTO with the error status
        return userMapper.updateUserDTOToResponseUserDTO(updateUserDTO, status);
    }

    @Override
    public ResponseUserDTO deleteUser(String userId) {
        // 1) Check if user exists locally
        Optional<User> maybeUser = userRepository.findById(userId);
        if (maybeUser.isEmpty()) {
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

        // 3) If Keycloak deletion succeeded, remove from local DB
        if (status == Response.Status.NO_CONTENT.getStatusCode()) {
            userRepository.delete(maybeUser.get());
            return userMapper.userToResponseUserDTO(
                    maybeUser.get(),
                    Response.Status.NO_CONTENT.getStatusCode()
            );
        }

        // 4) Otherwise, return a 404
        return new ResponseUserDTO(
                userId,
                null,
                null,
                Response.Status.NOT_FOUND.getStatusCode()
        );
    }

    @Override
    public ResponseUserDTO updateUserPassword(String userId, UpdateUserPasswordDTO updateUserPasswordDTO) {
        // 1) Check if user to be updated exists in local DB or by username
        if (userRepository.findById(userId).isEmpty()) {
            return userMapper.updateUserDTOToResponseUserDTO(
                    null, //TODO
                    Response.Status.NOT_FOUND.getStatusCode()
            );
        }

        // 2) Update user in Keycloak
        Response keycloakResponse = keycloakUserService.updateUserPassword(userId, updateUserPasswordDTO);
        int status = keycloakResponse.getStatus();

        // 3) If Keycloak update succeeded, update local DB
        if (status == Response.Status.NO_CONTENT.getStatusCode()) {
            return userMapper.userToResponseUserDTO(null, status); //TODO
        }

        // 4) Otherwise, return a DTO with the error status
        return userMapper.updateUserDTOToResponseUserDTO(null, status);// TODO
    }

    @Override
    public ResponseUserDTO forgotUserPassword(ForgotPasswordDTO updateUserPasswordDTO) {
        // Generate a reset token for the provided email
        String token = passwordResetService.generateResetToken(updateUserPasswordDTO.email());

        // Build a reset link; adjust the host/port as needed for your front end
        String resetLink = "http://localhost:4200/reset-password?token=" + token;

        // Compose the email
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(updateUserPasswordDTO.email());
        message.setSubject("Password Reset Request");
        message.setText("To reset your password, please click the following link:\n" + resetLink);

        // Send the email using MailHog SMTP settings
        mailSender.send(message);

        return null; //TODO
    }

    @Override
    public ResponseUserDTO resetUserPassword(String email, String newPassword) {
        if (userRepository.findByUsername(email) != null) {
            return userMapper.updateUserDTOToResponseUserDTO(
                    null, //TODO
                    Response.Status.NOT_FOUND.getStatusCode()
            );
        }

        // 2) Update user in Keycloak
        String userId = keycloakUserService.getUserIdByUsername(email);
        Response keycloakResponse = keycloakUserService.resetPassword(userId, newPassword);
        int status = keycloakResponse.getStatus();

        // 3) If Keycloak update succeeded, update local DB
        if (status == Response.Status.NO_CONTENT.getStatusCode()) {
            return userMapper.userToResponseUserDTO(null, status); //TODO
        }

        // 4) Otherwise, return a DTO with the error status
        return userMapper.updateUserDTOToResponseUserDTO(null, status);// TODO
    }

    @Override
    public List<ResponseUserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::userToResponseUserDTO)
                .toList();
    }

    @Override
    public ResponseUserDTO getUserById(String userId) {
        // Implementation TBD
        return null;
    }
}
