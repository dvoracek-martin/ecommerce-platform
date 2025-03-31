package com.dvoracekmartin.userservice.application.service;

import com.dvoracekmartin.userservice.application.dto.CreateUserDTO;
import com.dvoracekmartin.userservice.application.dto.UpdateUserDTO;
import jakarta.ws.rs.core.Response;
import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class KeycloakUserService {

    private static final Logger LOG = LoggerFactory.getLogger(KeycloakUserService.class);
    private static final String USER_CLIENT_ROLE = "user_client";

    @Value("${keycloak.admin.realm}")
    private String realm;

    @Value("${keycloak.admin.client-id}")
    private String clientId;

    @Value("${keycloak.admin.password}")
    private String adminPassword;

    @Value("${keycloak.admin.username}")
    private String adminUsername;

    @Value("${keycloak.server.url}")
    private String serverUrl;

    /**
     * Creates a new user in Keycloak and assigns the 'user_client' role.
     * Returns Keycloak's Response indicating success/failure.
     */
    public Response createUser(CreateUserDTO dto) {
        RealmResource realmResource = buildKeycloakClient().realm(realm);
            UsersResource usersResource = realmResource.users();

        UserRepresentation userRep = toUserRepresentation(dto);

        Response response;
        try {
            response = usersResource.create(userRep);
            LOG.info("Keycloak createUser response: status={} info={}",
                    response.getStatus(), response.getStatusInfo());

            // Print any error details
            LOG.debug("Keycloak createUser response body: {}", response.readEntity(String.class));
        } catch (Exception ex) {
            LOG.error("User {} couldn't be created: {}", dto.username(), ex.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }

        // If created, parse the userId from the 'Location' header and assign role
        if (response.getStatus() == Response.Status.CREATED.getStatusCode()) {
            String location = response.getHeaderString("Location");
            String userId = parseUserIdFromLocation(location);
            assignUserClientRole(realmResource, userId, USER_CLIENT_ROLE);
            LOG.info("Assigned 'user_client' role to userId:{}", userId);
        } else {
            LOG.warn("User creation failed with status:{}", response.getStatus());
        }

        return response;
    }

    /**
     * Updates an existing user in Keycloak.
     */
    public Response updateUser(String userId, UpdateUserDTO dto) {
        RealmResource realmResource = buildKeycloakClient().realm(realm);
        UsersResource usersResource = realmResource.users();

        UserRepresentation userRep = toUserRepresentation(dto);

        try {
            UserResource userResource = usersResource.get(userId);
            userResource.update(userRep);
            LOG.info("User {} updated successfully", dto.username());
            return Response.status(Response.Status.NO_CONTENT).build();
        } catch (Exception ex) {
            LOG.error("User {} couldn't be updated: {}", dto.username(), ex.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Deletes an existing user in Keycloak.
     */
    public Response deleteUser(String userId) {
        RealmResource realmResource = buildKeycloakClient().realm(realm);
        UsersResource usersResource = realmResource.users();

        try {
            UserResource userResource = usersResource.get(userId);
            userResource.remove();
            LOG.info("User with ID={} deleted successfully", userId);
            return Response.status(Response.Status.NO_CONTENT).build();
        } catch (Exception ex) {
            LOG.error("User with ID:{} couldn't be deleted: {}", userId, ex.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ----------------------------------
    // Private Helpers
    // ----------------------------------

    /**
     * Builds a Keycloak client for the admin user.
     */
    private Keycloak buildKeycloakClient() {
        return KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm(realm)
                .clientId(clientId)
                .username(adminUsername)
                .password(adminPassword)
                .grantType(OAuth2Constants.PASSWORD)
                .build();
    }

    /**
     * Converts CreateUserDTO into a Keycloak UserRepresentation.
     */
    private static UserRepresentation toUserRepresentation(CreateUserDTO dto) {
        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(dto.username());
        user.setEmail(dto.email());
        user.setRequiredActions(Collections.emptyList());

        CredentialRepresentation creds = new CredentialRepresentation();
        creds.setTemporary(false);
        creds.setType(CredentialRepresentation.PASSWORD);
        creds.setValue(dto.credentials().getFirst().value());
        user.setCredentials(Collections.singletonList(creds));

        return user;
    }

    /**
     * Converts UpdateUserDTO into a Keycloak UserRepresentation.
     */
    private static UserRepresentation toUserRepresentation(UpdateUserDTO dto) {
        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(dto.username());
        user.setEmail(dto.email());
        user.setRequiredActions(Collections.emptyList());

        CredentialRepresentation creds = new CredentialRepresentation();
        creds.setTemporary(false);
        creds.setType(CredentialRepresentation.PASSWORD);
        creds.setValue(dto.credentials().getFirst().value());
        user.setCredentials(Collections.singletonList(creds));

        return user;
    }

    /**
     * Extracts userId from the 'Location' header string.
     */
    private static String parseUserIdFromLocation(String location) {
        return location.substring(location.lastIndexOf('/') + 1);
    }

    /**
     * Assigns a realm-level role to the newly created user.
     */
    private static void assignUserClientRole(RealmResource realmResource, String userId, String roleName) {
        RoleRepresentation roleRep = realmResource.roles().get(roleName).toRepresentation();
        UserResource userResource = realmResource.users().get(userId);

        userResource.roles().realmLevel().add(Collections.singletonList(roleRep));
    }
}
