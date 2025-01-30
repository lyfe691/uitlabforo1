package com.matey.controller;

import com.matey.model.User;
import com.matey.payload.ApiResponse;
import com.matey.payload.PasswordChangeRequest;
import com.matey.payload.UserProfile;
import com.matey.security.CurrentUser;
import com.matey.security.UserPrincipal;
import com.matey.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfile> getCurrentUser(@CurrentUser UserPrincipal currentUser) {
        User user = userService.getUserById(currentUser.getId());
        UserProfile userProfile = new UserProfile(
                user.getId(),
                user.getUsername(),
                user.getEmail()
        );
        return ResponseEntity.ok(userProfile);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody UserProfile userProfile) {
        try {
            User updatedUser = userService.updateUser(currentUser.getId(), userProfile);
            UserProfile response = new UserProfile(
                    updatedUser.getId(),
                    updatedUser.getUsername(),
                    updatedUser.getEmail()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody PasswordChangeRequest passwordChangeRequest) {
        try {
            userService.changePassword(
                    currentUser.getId(),
                    passwordChangeRequest.getCurrentPassword(),
                    passwordChangeRequest.getNewPassword()
            );
            return ResponseEntity.ok(new ApiResponse(true, "Password updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/members")
    public ResponseEntity<?> getMembers(@CurrentUser UserPrincipal currentUser) {
        try {
            List<UserProfile> members = userService.getAllUsers().stream()
                .filter(user -> !user.getId().equals(currentUser.getId()))
                .map(user -> new UserProfile(user.getId(), user.getUsername(), user.getEmail()))
                .collect(Collectors.toList());
            return ResponseEntity.ok(members);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/me/friends")
    public ResponseEntity<?> getFriends(@CurrentUser UserPrincipal currentUser) {
        try {
            List<UserProfile> friends = userService.getFriends(currentUser.getId()).stream()
                .map(user -> new UserProfile(user.getId(), user.getUsername(), user.getEmail()))
                .collect(Collectors.toList());
            return ResponseEntity.ok(friends);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/me/friend-requests")
    public ResponseEntity<?> getFriendRequests(@CurrentUser UserPrincipal currentUser) {
        try {
            List<UserProfile> requests = userService.getFriendRequests(currentUser.getId()).stream()
                .map(user -> new UserProfile(user.getId(), user.getUsername(), user.getEmail()))
                .collect(Collectors.toList());
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/friend-request/{userId}")
    public ResponseEntity<?> sendFriendRequest(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable String userId) {
        try {
            userService.sendFriendRequest(currentUser.getId(), userId);
            return ResponseEntity.ok(new ApiResponse(true, "Friend request sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/friend-request/{userId}/accept")
    public ResponseEntity<?> acceptFriendRequest(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable String userId) {
        try {
            userService.acceptFriendRequest(currentUser.getId(), userId);
            return ResponseEntity.ok(new ApiResponse(true, "Friend request accepted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/friend-request/{userId}/reject")
    public ResponseEntity<?> rejectFriendRequest(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable String userId) {
        try {
            userService.rejectFriendRequest(currentUser.getId(), userId);
            return ResponseEntity.ok(new ApiResponse(true, "Friend request rejected"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @DeleteMapping("/friend/{userId}")
    public ResponseEntity<?> removeFriend(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable String userId) {
        try {
            userService.removeFriend(currentUser.getId(), userId);
            return ResponseEntity.ok(new ApiResponse(true, "Friend removed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
} 