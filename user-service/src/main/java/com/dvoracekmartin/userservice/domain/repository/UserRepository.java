package com.dvoracekmartin.userservice.domain.repository;

import com.dvoracekmartin.userservice.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, String> {
    User findByUsername(String username);

    boolean existsByUsername(String username);
}
