package com.matey.service;

import com.matey.model.User;
import com.matey.payload.UserProfile;
import com.matey.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }

    public User updateUser(String id, UserProfile userProfile) {
        User user = getUserById(id);

        // Check if username is being changed and is already taken
        if (!user.getUsername().equals(userProfile.getUsername()) && 
            existsByUsername(userProfile.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }

        // Check if email is being changed and is already taken
        if (!user.getEmail().equals(userProfile.getEmail()) && 
            existsByEmail(userProfile.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        user.setUsername(userProfile.getUsername());
        user.setEmail(userProfile.getEmail());
        return userRepository.save(user);
    }

    public void changePassword(String id, String currentPassword, String newPassword) {
        User user = getUserById(id);
        
        // Verify current password
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), currentPassword)
        );

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getFriends(String userId) {
        User user = getUserById(userId);
        return new ArrayList<>(user.getFriends());
    }

    public List<User> getFriendRequests(String userId) {
        User user = getUserById(userId);
        return new ArrayList<>(user.getFriendRequests());
    }

    // Send friend request
    public void sendFriendRequest(String fromUserId, String toUserId) {
        if (fromUserId.equals(toUserId)) {
            throw new IllegalArgumentException("Cannot send friend request to yourself");
        }

        User fromUser = getUserById(fromUserId);
        User toUser = getUserById(toUserId);

        if (fromUser.getFriends().contains(toUser)) {
            throw new IllegalArgumentException("Already friends with this user");
        }

        if (toUser.getFriendRequests().contains(fromUser)) {
            throw new IllegalArgumentException("Friend request already sent");
        }

        toUser.getFriendRequests().add(fromUser);
        userRepository.save(toUser);
    }

    // Accept friend request
    public void acceptFriendRequest(String userId, String friendId) {
        User user = getUserById(userId);
        User friend = getUserById(friendId);

        if (!user.getFriendRequests().contains(friend)) {
            throw new IllegalArgumentException("No friend request from this user");
        }

        user.getFriendRequests().remove(friend);
        user.getFriends().add(friend);
        friend.getFriends().add(user);

        userRepository.save(user);
        userRepository.save(friend);
    }

    // Reject friend request
    public void rejectFriendRequest(String userId, String friendId) {
        User user = getUserById(userId);
        User friend = getUserById(friendId);

        if (!user.getFriendRequests().contains(friend)) {
            throw new IllegalArgumentException("No friend request from this user");
        }

        user.getFriendRequests().remove(friend);
        userRepository.save(user);
    }

    // Remove friend
    public void removeFriend(String userId, String friendId) {
        User user = getUserById(userId);
        User friend = getUserById(friendId);

        if (!user.getFriends().contains(friend)) {
            throw new IllegalArgumentException("Not friends with this user");
        }

        user.getFriends().remove(friend);
        friend.getFriends().remove(user);

        userRepository.save(user);
        userRepository.save(friend);
    }
} 
