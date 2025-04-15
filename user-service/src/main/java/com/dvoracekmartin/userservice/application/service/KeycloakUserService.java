package com.dvoracekmartin.userservice.application.service;

import com.dvoracekmartin.userservice.application.dto.CreateUserDTO;
import com.dvoracekmartin.userservice.application.dto.UpdateUserDTO;
import com.dvoracekmartin.userservice.application.dto.UpdateUserPasswordDTO;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
@Slf4j
public class KeycloakUserService {

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

    private static UserRepresentation toUserRepresentation(CreateUserDTO dto) {
        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(dto.username());
        user.setFirstName(dto.username());
        user.setLastName(dto.username());
        user.setEmail(dto.email());
        user.setRequiredActions(Collections.emptyList());

        CredentialRepresentation creds = new CredentialRepresentation();
        creds.setTemporary(false);
        creds.setType(CredentialRepresentation.PASSWORD);
        creds.setValue(dto.credentials().getFirst().value());
        user.setCredentials(Collections.singletonList(creds));

        return user;
    }

    private static UserRepresentation toUserRepresentation(UpdateUserDTO dto) {
        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(dto.username());
        user.setFirstName(dto.username());
        user.setLastName(dto.username());
        user.setEmail(dto.email());
        user.setRequiredActions(Collections.emptyList());

        CredentialRepresentation creds = new CredentialRepresentation();
        creds.setTemporary(false);
        creds.setType(CredentialRepresentation.PASSWORD);
        creds.setValue(dto.credentials().getFirst().value());
        user.setCredentials(Collections.singletonList(creds));

        return user;
    }

    private static String parseUserIdFromLocation(String location) {
        return location.substring(location.lastIndexOf('/') + 1);
    }

    private static void assignUserClientRole(RealmResource realmResource, String userId) {
        try {
            RoleRepresentation role = realmResource.roles().get(USER_CLIENT_ROLE).toRepresentation();
            realmResource.users().get(userId).roles().realmLevel().add(Collections.singletonList(role));
        } catch (Exception ex) {
            log.warn("Role assignment failed: {}", userId);
        }
    }

    public Response createUser(CreateUserDTO dto) {
        try {
            log.debug("Creating user: {}", dto.username());
            RealmResource realmResource = buildKeycloakClient().realm(realm);
            Response response = realmResource.users().create(toUserRepresentation(dto));

            if (response.getStatus() == Response.Status.CREATED.getStatusCode()) {
                String userId = parseUserIdFromLocation(response.getHeaderString("Location"));
                log.info("User created: {}", userId);
                assignUserClientRole(realmResource, userId);
            }
            return response;
        } catch (Exception ex) {
            log.error("Create failed: {}", dto.username(), ex);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    public Response updateUser(String userId, UpdateUserDTO dto) {
        try {
            log.debug("Updating user: {}", userId);
            buildKeycloakClient().realm(realm).users().get(userId).update(toUserRepresentation(dto));
            return Response.status(Response.Status.NO_CONTENT).build();
        } catch (Exception ex) {
            log.error("Update failed: {}", userId, ex);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    public Response deleteUser(String userId) {
        try {
            log.info("Deleting user: {}", userId);
            buildKeycloakClient().realm(realm).users().get(userId).remove();
            return Response.status(Response.Status.NO_CONTENT).build();
        } catch (Exception ex) {
            log.error("Delete failed: {}", userId, ex);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    public String getUserIdByUsername(String username) {
        try {
            log.debug("Fetching ID for: {}", username);
            return buildKeycloakClient().realm(realm).users().search(username).getFirst().getId();
        } catch (Exception ex) {
            log.warn("User not found: {}", username);
            return null;
        }
    }

    public Response updateUserPassword(String userId, UpdateUserPasswordDTO dto) {
        try {
            log.debug("Updating password: {}", userId);
            if (!verifyCurrentPassword(userId, dto.currentPassword())) {
                log.warn("Invalid password: {}", userId);
                return Response.status(Response.Status.UNAUTHORIZED).build();
            }

            CredentialRepresentation cred = new CredentialRepresentation();
            cred.setType(CredentialRepresentation.PASSWORD);
            cred.setValue(dto.newPassword());
            cred.setTemporary(false);

            buildKeycloakClient().realm(realm).users().get(userId).resetPassword(cred);
            return Response.ok().build();
        } catch (Exception ex) {
            log.error("Password update failed: {}", userId, ex);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    public Response resetPassword(String userId, String newPassword) {
        try {
            log.info("Resetting password: {}", userId);
            CredentialRepresentation cred = new CredentialRepresentation();
            cred.setType(CredentialRepresentation.PASSWORD);
            cred.setValue(newPassword);
            cred.setTemporary(false);

            buildKeycloakClient().realm(realm).users().get(userId).resetPassword(cred);
            return Response.ok().build();
        } catch (Exception ex) {
            log.error("Password reset failed: {}", userId, ex);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    private boolean verifyCurrentPassword(String userId, String currentPassword) {
        try {
            log.debug("Verifying password: {}", userId);
            UserRepresentation user = buildKeycloakClient().realm(realm).users().get(userId).toRepresentation();
            Keycloak keycloak = KeycloakBuilder.builder()
                    .serverUrl(serverUrl)
                    .realm(realm)
                    .clientId(clientId)
                    .username(user.getUsername())
                    .password(currentPassword)
                    .grantType(OAuth2Constants.PASSWORD)
                    .build();
            keycloak.tokenManager().getAccessToken();
            return true;
        } catch (Exception ex) {
            log.debug("Password verification failed: {}", userId);
            return false;
        }
    }

    private Keycloak buildKeycloakClient() {
        log.debug("Building admin client");
        return KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm(realm)
                .clientId(clientId)
                .username(adminUsername)
                .password(adminPassword)
                .grantType(OAuth2Constants.PASSWORD)
                .build();
    }
}
