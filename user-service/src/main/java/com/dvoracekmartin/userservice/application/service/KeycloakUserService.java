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
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@Slf4j
public class KeycloakUserService implements UserAuthenticationService{

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

    private static UserRepresentation toUserRepresentation(CreateUserDTO dto, boolean enabled) {
        UserRepresentation user = new UserRepresentation();
        user.setEnabled(enabled);
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

    private static void revokeUserClientRole(RealmResource realmResource, String userId) {
        try {
            RoleRepresentation role = realmResource.roles().get(USER_CLIENT_ROLE).toRepresentation();
            realmResource.users().get(userId).roles().realmLevel().remove(Collections.singletonList(role));
        } catch (Exception ex) {
            log.warn("Role revocation failed: {}", userId);
        }
    }

    @Override
    public void addOrRevokeUserAccess(String userId, boolean assign) {
        try {
            log.debug("{} role '{}' for user: {}", assign ? "Assigning" : "Revoking", USER_CLIENT_ROLE, userId);

            RealmResource realmResource = buildKeycloakClient().realm(realm);
            // first, fetch the current user representation
            UserRepresentation user = realmResource.users().get(userId).toRepresentation();

            if (assign) {
                assignUserClientRole(realmResource, userId);
                // set enabled flag to true
                user.setEnabled(true);
            } else {
                revokeUserClientRole(realmResource, userId);
                // set enabled flag to false
                user.setEnabled(false);
            }

            // update the user with the new state
            realmResource.users().get(userId).update(user);

            Response.status(Response.Status.NO_CONTENT).build();
        } catch (Exception ex) {
            log.error("Role {} failed: {} - {}", assign ? "assignment" : "revocation", userId, ex.getMessage());
            Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public Response createUser(CreateUserDTO dto, boolean enabled) {
        try {
            log.debug("Creating user: {} with enabled: {}", dto.username(), enabled);
            RealmResource realmResource = buildKeycloakClient().realm(realm);
            Response response = realmResource.users().create(toUserRepresentation(dto, enabled));

            if (response.getStatus() == Response.Status.CREATED.getStatusCode()) {
                String userId = parseUserIdFromLocation(response.getHeaderString("Location"));
                log.info("User created: {}", userId);
                if (enabled) {
                    assignUserClientRole(realmResource, userId);
                }
            }
            return response;
        } catch (Exception ex) {
            log.error("Create failed: {}", dto.username(), ex);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public Response activateUser(String userId) {
        try {
            log.debug("Activating user: {}", userId);
            RealmResource realmResource = buildKeycloakClient().realm(realm);
            UserRepresentation user = realmResource.users().get(userId).toRepresentation();

            // Enable the user account
            user.setEnabled(true);

            // Set email verified to true
            user.setEmailVerified(true);

            // Update the user in Keycloak
            realmResource.users().get(userId).update(user);

            // Assign the user client role upon activation
            assignUserClientRole(realmResource, userId);

            log.info("User activated successfully: {}", userId);
            return Response.status(Response.Status.NO_CONTENT).build();
        } catch (Exception ex) {
            log.error("Activation failed: {}", userId, ex);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
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

    @Override
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

    @Override
    public String getUserIdByUsername(String username) {
        try {
            log.debug("Fetching ID for: {}", username);
            return buildKeycloakClient().realm(realm).users().search(username).getFirst().getId();
        } catch (Exception ex) {
            log.warn("User not found: {}", username);
            return null;
        }
    }

    @Override
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

    @Override
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
        log.debug("Building client");
        return KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm(realm)
                .clientId(clientId)
                .username(adminUsername)
                .password(adminPassword)
                .grantType(OAuth2Constants.PASSWORD)
                .build();
    }

    @Override
    public void updateUserEmail(UpdateUserDTO updateUserDTO) {
        try {
            log.debug("Updating user by username/email: {}", updateUserDTO.username());

            RealmResource realmResource = buildKeycloakClient().realm(realm);

            // Find user by username or email
            UserRepresentation user = null;

            if (updateUserDTO.username() != null && !updateUserDTO.username().isBlank()) {
                user = realmResource.users().search(updateUserDTO.username()).stream().findFirst().orElse(null);
            }

            if (user == null && updateUserDTO.email() != null && !updateUserDTO.email().isBlank()) {
                user = realmResource.users().search(updateUserDTO.email()).stream().findFirst().orElse(null);
            }

            if (user == null) {
                log.warn("User not found for update: {}", updateUserDTO.username());
                return;
            }

            if (updateUserDTO.email() != null && !updateUserDTO.email().isBlank()) {
                user.setEmail(updateUserDTO.email());
            }

            realmResource.users().get(user.getId()).update(user);
            log.info("User updated successfully: {}", user.getId());

        } catch (Exception ex) {
            log.error("Failed to update user by email: {}", updateUserDTO.username(), ex);
        }
    }
}