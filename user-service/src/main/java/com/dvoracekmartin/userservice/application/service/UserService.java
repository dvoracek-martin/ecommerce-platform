package com.dvoracekmartin.userservice.application.service;


import com.dvoracekmartin.userservice.application.dto.CreateUserDTO;
import com.dvoracekmartin.userservice.application.dto.ResponseUserDTO;

import java.util.List;

public interface UserService {

    List<ResponseUserDTO> getAllUsers();

    ResponseUserDTO getUserById(String userId);

    void deleteUser(String productCode);

    ResponseUserDTO createUser(CreateUserDTO createUserDTO);
}
