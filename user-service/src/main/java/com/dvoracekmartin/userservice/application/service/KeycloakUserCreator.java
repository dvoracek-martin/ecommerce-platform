package com.dvoracekmartin.userservice.application.service;

import com.dvoracekmartin.userservice.application.dto.CreateUserDTO;
import jakarta.ws.rs.core.Response;
import org.apache.commons.lang.exception.ExceptionUtils;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class KeycloakUserCreator {

    @Value("${keycloak.admin.realm}")
    private String realm;
    @Value("${keycloak.admin.client-id}")
    private String clientId;
    @Value("${keycloak.admin.password}")
    private String password;
    @Value("${keycloak.admin.username}")
    private String username;
    @Value("${keycloak.server.url}")
    private String serverUrl;

    private static final Logger log = LoggerFactory.getLogger(KeycloakUserCreator.class);

    public Response createUser(CreateUserDTO newUser) {
        Response response = null;
        Keycloak keycloak = Keycloak.getInstance(serverUrl, realm, username, password, clientId);
        RealmResource realmResource = keycloak.realm(realm);
        UsersResource usersResource = realmResource.users();
        UserRepresentation userRepresentation = getUserRepresentation(newUser);
        try {
            response = usersResource.create(userRepresentation);
            log.info("CreateUser response status info: username {} {}", username, response.getStatusInfo());
            log.debug("CreateUser response status code: {}", response.getStatus());
            log.debug("CreateUser response status details: {}", response.getMetadata());

        } catch (Exception e) {
            log.error("User {} couldn't be created: {}", username, ExceptionUtils.getStackTrace(e));
        }
        return response;
    }

    private static UserRepresentation getUserRepresentation(CreateUserDTO newUser) {
        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(newUser.username());
        user.setFirstName(newUser.firstName());
        user.setLastName(newUser.lastName());
        user.setEmail(newUser.email());
        user.setRequiredActions(Collections.emptyList());


        CredentialRepresentation credentialRepresentation = new CredentialRepresentation();
        credentialRepresentation.setTemporary(false);
        credentialRepresentation.setType(CredentialRepresentation.PASSWORD);
        credentialRepresentation.setValue(newUser.credentials().getFirst().value());
        user.setCredentials(Collections.singletonList(credentialRepresentation));
        return user;
    }
}
