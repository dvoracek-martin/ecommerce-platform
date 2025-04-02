package com.dvoracekmartin.userservice.application.service;


import com.dvoracekmartin.userservice.application.dto.*;

import java.util.List;


public interface UserService {

    List<ResponseUserDTO> getAllUsers();

    ResponseUserDTO getUserById(String userId);

    ResponseUserDTO createUser(CreateUserDTO createUserDTO);

    ResponseUserDTO updateUser(String userId, UpdateUserDTO updateUserDTO);

    ResponseUserDTO deleteUser(String userId);

    ResponseUserDTO updateUserPassword(String userId, UpdateUserPasswordDTO updateUserPasswordDTO);

    ResponseUserDTO forgotUserPassword(ForgotPasswordDTO updateUserPasswordDTO);

    ResponseUserDTO resetUserPassword(String email, String newPassword);
}
