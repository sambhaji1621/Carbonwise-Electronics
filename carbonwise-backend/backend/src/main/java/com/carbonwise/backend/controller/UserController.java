package com.carbonwise.backend.controller;

import com.carbonwise.backend.entity.User;
import com.carbonwise.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            // Securely extract the phone number from the JWT Token
            String phone = SecurityContextHolder.getContext().getAuthentication().getName();
            
            // Fetch the exact user from the MySQL database
            User user = userRepository.findByPhone(phone).orElseThrow();
            
            // Wipe the password before sending the profile to the frontend for security
            user.setPassword(null); 
            
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("User profile not found or unauthorized");
        }
    }
}