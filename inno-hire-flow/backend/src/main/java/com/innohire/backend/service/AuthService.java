package com.innohire.backend.service;

import com.innohire.backend.controller.AuthRequest;
import com.innohire.backend.controller.AuthResponse;
import com.innohire.backend.controller.RegisterRequest;
import com.innohire.backend.model.Profile;
import com.innohire.backend.repository.ProfileRepository;
import com.innohire.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        var profile = Profile.builder()
                .id(UUID.randomUUID().toString())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .defaultJobLocation(request.getDefaultJobLocation() != null ? request.getDefaultJobLocation() : "")
                .defaultExperienceRange(request.getDefaultExperienceRange() != null ? request.getDefaultExperienceRange() : "")
                .department(request.getDepartment() != null ? request.getDepartment() : "")
                .build();
        
        profileRepository.save(profile);

        var userContext = new User(profile.getEmail(), profile.getPassword(), new ArrayList<>());
        var jwtToken = jwtUtil.generateToken(userContext);
        
        return AuthResponse.builder()
                .token(jwtToken)
                .build();
    }

    public AuthResponse authenticate(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var profile = profileRepository.findByEmail(request.getEmail())
                .orElseThrow();
        
        var userContext = new User(profile.getEmail(), profile.getPassword(), new ArrayList<>());
        var jwtToken = jwtUtil.generateToken(userContext);

        return AuthResponse.builder()
                .token(jwtToken)
                .build();
    }
}
