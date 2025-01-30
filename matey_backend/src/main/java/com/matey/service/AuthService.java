package com.matey.service;

import com.matey.model.User;
import com.matey.payload.LoginRequest;
import com.matey.payload.SignUpRequest;
import com.matey.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public String authenticateUser(LoginRequest loginRequest) {
        // Try to find user by email or username
        User user = null;
        try {
            user = userService.getUserByEmail(loginRequest.getEmailOrUsername());
        } catch (Exception e) {
            try {
                user = userService.getUserByUsername(loginRequest.getEmailOrUsername());
            } catch (Exception ex) {
                throw new IllegalArgumentException("Invalid email/username or password");
            }
        }

        // Authenticate with the email (since our UserDetails uses email as the username)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        user.getEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        return tokenProvider.generateToken(authentication);
    }

    public void registerUser(SignUpRequest signUpRequest) {
        if (userService.existsByUsername(signUpRequest.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }

        if (userService.existsByEmail(signUpRequest.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = new User(
                signUpRequest.getUsername(),
                signUpRequest.getEmail(),
                passwordEncoder.encode(signUpRequest.getPassword())
        );

        userService.save(user);
    }

    public void changePassword(String userId, String currentPassword, String newPassword) {
        User user = userService.getUserById(userId);
        
        // Verify current password
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), currentPassword)
        );

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userService.save(user);
    }
} 