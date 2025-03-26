package com.dvoracekmartin.userservice.application.service;

import com.dvoracekmartin.userservice.application.dto.*;
import com.dvoracekmartin.userservice.domain.model.User;
import com.dvoracekmartin.userservice.domain.repository.UserRepository;
import jakarta.ws.rs.core.Response;
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

    public UserServiceImpl(KeycloakUserService keycloakUserService,
                           UserMapper userMapper,
                           UserRepository userRepository) {
        this.keycloakUserService = keycloakUserService;
        this.userMapper = userMapper;
        this.userRepository = userRepository;
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

            return userMapper.userToResponseUserDTO(savedUser, status);
        }

        // 5) Otherwise, return a DTO with the error status
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
                null,
                null,
                Response.Status.NOT_FOUND.getStatusCode()
        );
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
