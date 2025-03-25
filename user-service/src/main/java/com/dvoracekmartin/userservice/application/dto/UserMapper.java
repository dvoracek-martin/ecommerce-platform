package com.dvoracekmartin.userservice.application.dto;

import com.dvoracekmartin.userservice.domain.model.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    User createUserDTOToUser(CreateUserDTO createUserDTO);

    ResponseUserDTO userToResponseUserDTO(User user);

    ResponseUserDTO createUserDTOToResponseUserDTO(CreateUserDTO createUserDTO, int statusCode);
}
