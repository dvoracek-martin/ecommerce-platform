package com.dvoracekmartin.userservice.application.service;


import com.dvoracekmartin.userservice.application.dto.CreateUserDTO;
import com.dvoracekmartin.userservice.application.dto.ResponseUserDTO;
import com.dvoracekmartin.userservice.application.dto.UpdateUserDTO;

import java.util.List;


public interface UserService {

    List<ResponseUserDTO> getAllUsers();

    ResponseUserDTO getUserById(String userId);

    ResponseUserDTO createUser(CreateUserDTO createUserDTO);

    ResponseUserDTO updateUser(String userId, UpdateUserDTO updateUserDTO);

    ResponseUserDTO deleteUser(String userId);
}
