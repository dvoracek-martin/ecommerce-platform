package com.dvoracekmartin.userservice.application.service;

import com.dvoracekmartin.userservice.application.dto.CreateUserDTO;
import com.dvoracekmartin.userservice.application.dto.ResponseUserDTO;
import com.dvoracekmartin.userservice.application.dto.UserMapper;
import com.dvoracekmartin.userservice.domain.repository.UserRepository;
import jakarta.ws.rs.core.Response;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final KeycloakUserCreator userCreator;

    private final UserMapper userMapper;

    private final UserRepository userRepository;

    private static final int OK_STATUS_CODE = 200;

    public UserServiceImpl(KeycloakUserCreator userCreator, UserMapper userMapper, UserRepository userRepository) {
        this.userCreator = userCreator;
        this.userMapper = userMapper;
        this.userRepository = userRepository;
    }


    @Override
    public List<ResponseUserDTO> getAllUsers() {
        return List.of();
    }

    @Override
    public ResponseUserDTO getUserById(String userId) {
        return null;
    }

    @Override
    public void deleteUser(String userId) {
        // to be implemented
    }

    @Override
    public ResponseUserDTO createUser(CreateUserDTO createUserDTO) {
        Response response = userCreator.createUser(createUserDTO);

        return response.getStatus() == OK_STATUS_CODE
                ? userMapper.userToResponseUserDTO(userRepository.save(userMapper.createUserDTOToUser(createUserDTO)))
                : userMapper.createUserDTOToResponseUserDTO(createUserDTO, response.getStatus());
    }
}
