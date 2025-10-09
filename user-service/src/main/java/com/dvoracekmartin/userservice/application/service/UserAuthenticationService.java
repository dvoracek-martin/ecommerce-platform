package com.dvoracekmartin.userservice.application.service;

import com.dvoracekmartin.userservice.application.dto.CreateUserDTO;
import com.dvoracekmartin.userservice.application.dto.UpdateUserDTO;
import com.dvoracekmartin.userservice.application.dto.UpdateUserPasswordDTO;
import jakarta.ws.rs.core.Response;

public interface UserAuthenticationService {
    Response createUser(CreateUserDTO createUserDTO, boolean enabled);
    Response updateUser(String userId, UpdateUserDTO updateUserDTO);
    Response deleteUser(String userId);
    Response updateUserPassword(String userId, UpdateUserPasswordDTO updateUserPasswordDTO);
    Response resetPassword(String userId, String newPassword);
    String getUserIdByUsername(String username);
    void addOrRevokeUserAccess(String userId, boolean active);
    void updateUserEmail(UpdateUserDTO updateUserDTO);
    Response activateUser(String userId);
}