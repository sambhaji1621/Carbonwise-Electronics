package com.carbonwise.backend.service;

import com.carbonwise.backend.dto.request.LoginRequest;
import com.carbonwise.backend.dto.request.RegisterRequest;
import com.carbonwise.backend.dto.response.AuthResponse;
import com.carbonwise.backend.entity.Role;
import com.carbonwise.backend.entity.User;
import com.carbonwise.backend.repository.UserRepository;
import com.carbonwise.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        // 1. Check if phone already exists
        if (userRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new RuntimeException("Phone number is already registered."); // We will catch this in GlobalExceptionHandler later
        }

        // 2. Determine Role (Default to Standard User)
        Role userRole = Role.ROLE_USER;
        if (request.getRole() != null && request.getRole().equalsIgnoreCase("RECYCLER")) {
            userRole = Role.ROLE_RECYCLER;
        }

        // 3. Build and Save User
        User user = User.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .city(request.getCity())
                .pinCode(request.getPinCode())
                .role(userRole)
                .carbonCredits(BigDecimal.ZERO)
                .build();

        userRepository.save(user);

        // 4. Generate JWT
        String jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .message("User registered successfully")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // 1. Authenticate credentials via Spring Security
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getPhone(),
                        request.getPassword()
                )
        );

        // 2. Fetch User and Generate Token
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .message("Login successful")
                .build();
    }
}