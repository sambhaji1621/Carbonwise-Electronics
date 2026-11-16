package com.carbonwise.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User implements UserDetails { 

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true, length = 15)
    private String phone;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String city;

    @Column(name = "pin_code")
    private String pinCode;

    @Column(precision = 10, scale = 2)
    private BigDecimal carbonCredits;

    @Builder.Default
    @Column(nullable = false)
    private Integer accountHealth = 100;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public BigDecimal getCarbonCredits() {
        return carbonCredits != null ? carbonCredits : BigDecimal.ZERO;
    }

    // --- SPRING SECURITY USERDETAILS OVERRIDES ---

    @JsonIgnore
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String roleName = role != null ? role.name() : "ROLE_USER";
        String simpleName = roleName.startsWith("ROLE_") ? roleName.substring(5) : roleName;
        return List.of(
            new SimpleGrantedAuthority(roleName),
            new SimpleGrantedAuthority("ROLE_" + roleName),
            new SimpleGrantedAuthority(simpleName)
        );
    }

    @JsonIgnore
    @Override
    public String getUsername() {
        return phone; 
    }

    @JsonIgnore
    @Override
    public boolean isAccountNonExpired() { return true; }

    @JsonIgnore
    @Override
    public boolean isAccountNonLocked() { return true; }

    @JsonIgnore
    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @JsonIgnore
    @Override
    public boolean isEnabled() { return true; }
}
