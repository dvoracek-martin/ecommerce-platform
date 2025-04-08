package com.dvoracekmartin.userservice.application.dto;

import com.dvoracekmartin.userservice.domain.model.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    ResponseUserDTO userToResponseUserDTO(User user);

    ResponseUserDTO userToResponseUserDTO(User user, int statusCode);

    ResponseUserDTO createUserDTOToResponseUserDTO(CreateUserDTO createUserDTO, int statusCode);

    ResponseUserDTO updateUserDTOToResponseUserDTO(UpdateUserDTO updateUserDTO, int status);

    User createUserDTOToUser(CreateUserDTO createUserDTO, String id);

    User updateUserDTOToUser(UpdateUserDTO updateUserDTO, String id);

    ResponseUserDTO updateUserDTOToResponseUserDTO(ForgotPasswordDTO updateUserPasswordDTO, int statusCode);

    ResponseUserDTO updateUserPasswordDTOToResponseUserDTO(UpdateUserPasswordDTO updateUserPasswordDTO, int statusCode);
}
