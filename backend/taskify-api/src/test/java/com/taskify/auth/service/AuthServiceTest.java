package com.taskify.auth.service;

import com.taskify.auth.dto.AuthRequest;
import com.taskify.auth.dto.AuthResponse;
import com.taskify.auth.dto.RegisterRequest;
import com.taskify.auth.jwt.JwtService;
import com.taskify.auth.model.RefreshToken;
import com.taskify.exception.BadRequestException;
import com.taskify.exception.ResourceNotFoundException;
import com.taskify.user.model.User;
import com.taskify.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private RefreshTokenService refreshTokenService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private AuthRequest authRequest;
    private User user;
    private RefreshToken refreshToken;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
                .name("Test User")
                .email("test@example.com")
                .password("password")
                .build();

        authRequest = AuthRequest.builder()
                .email("test@example.com")
                .password("password")
                .build();

        user = User.builder()
                .id("1")
                .name("Test User")
                .email("test@example.com")
                .password("encodedPassword")
                .build();

        refreshToken = RefreshToken.builder()
                .id("rt-1")
                .token("refresh-token-uuid")
                .userId("1")
                .expiryDate(Instant.now().plusSeconds(604800))
                .build();
    }

    @Test
    void register_Success() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(jwtService.generateToken(anyString())).thenReturn("jwt-token");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User savedUser = invocation.getArgument(0);
            savedUser.setId("1");
            return savedUser;
        });
        when(refreshTokenService.createRefreshToken(anyString())).thenReturn(refreshToken);

        AuthResponse response = authService.register(registerRequest);

        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        assertEquals("refresh-token-uuid", response.getRefreshToken());
        verify(userRepository).save(any(User.class));
        verify(refreshTokenService).createRefreshToken(anyString());
    }

    @Test
    void register_EmailAlreadyExists_ThrowsBadRequestException() {
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(registerRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_Success() {
        when(authenticationManager.authenticate(any())).thenReturn(
                new UsernamePasswordAuthenticationToken(authRequest.getEmail(), authRequest.getPassword()));
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(jwtService.generateToken(anyString())).thenReturn("jwt-token");
        when(refreshTokenService.createRefreshToken(anyString())).thenReturn(refreshToken);

        AuthResponse response = authService.login(authRequest);

        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        assertEquals("refresh-token-uuid", response.getRefreshToken());
    }

    @Test
    void login_InvalidCredentials_ThrowsBadCredentialsException() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        assertThrows(BadCredentialsException.class, () -> authService.login(authRequest));
    }

    @Test
    void login_UserNotFound_ThrowsResourceNotFoundException() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.login(authRequest));
    }

    @Test
    void refresh_Success() {
        when(refreshTokenService.verifyRefreshToken("refresh-token-uuid")).thenReturn(refreshToken);
        when(userRepository.findById("1")).thenReturn(Optional.of(user));
        when(jwtService.generateToken("test@example.com")).thenReturn("new-jwt-token");

        AuthResponse response = authService.refresh("refresh-token-uuid");

        assertNotNull(response);
        assertEquals("new-jwt-token", response.getToken());
        assertEquals("refresh-token-uuid", response.getRefreshToken());
    }

    @Test
    void refresh_InvalidToken_ThrowsBadRequestException() {
        when(refreshTokenService.verifyRefreshToken("invalid-token"))
                .thenThrow(new BadRequestException("Refresh token inválido"));

        assertThrows(BadRequestException.class, () -> authService.refresh("invalid-token"));
    }

    @Test
    void logout_Success() {
        when(refreshTokenService.verifyRefreshToken("refresh-token-uuid")).thenReturn(refreshToken);
        doNothing().when(refreshTokenService).deleteByUserId("1");

        assertDoesNotThrow(() -> authService.logout("refresh-token-uuid"));
        verify(refreshTokenService).deleteByUserId("1");
    }
}
