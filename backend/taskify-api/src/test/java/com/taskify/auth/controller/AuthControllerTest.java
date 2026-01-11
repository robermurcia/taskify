package com.taskify.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskify.auth.dto.AuthRequest;
import com.taskify.auth.dto.AuthResponse;
import com.taskify.auth.dto.RefreshRequest;
import com.taskify.auth.dto.RegisterRequest;
import com.taskify.auth.jwt.JwtFilter;
import com.taskify.auth.service.AuthService;
import com.taskify.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @MockBean
        private AuthService authService;

        @MockBean
        private JwtFilter jwtFilter;

        @MockBean
        private UserDetailsService userDetailsService;

        @Test
        void register_Success() throws Exception {
                RegisterRequest request = RegisterRequest.builder()
                                .name("Test User")
                                .email("test@example.com")
                                .password("password")
                                .build();

                AuthResponse response = AuthResponse.builder()
                                .token("jwt-token")
                                .refreshToken("refresh-token")
                                .build();

                when(authService.register(any(RegisterRequest.class))).thenReturn(response);

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").value("jwt-token"))
                                .andExpect(jsonPath("$.refreshToken").value("refresh-token"));
        }

        @Test
        void register_InvalidEmail_ReturnsBadRequest() throws Exception {
                RegisterRequest request = RegisterRequest.builder()
                                .name("Test User")
                                .email("invalid-email")
                                .password("password")
                                .build();

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void register_EmailAlreadyExists_ReturnsBadRequest() throws Exception {
                RegisterRequest request = RegisterRequest.builder()
                                .name("Test User")
                                .email("exists@example.com")
                                .password("password")
                                .build();

                when(authService.register(any(RegisterRequest.class)))
                                .thenThrow(new BadRequestException("Email already in use"));

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("Email already in use"));
        }

        @Test
        void login_Success() throws Exception {
                AuthRequest request = AuthRequest.builder()
                                .email("test@example.com")
                                .password("password")
                                .build();

                AuthResponse response = AuthResponse.builder()
                                .token("jwt-token")
                                .refreshToken("refresh-token")
                                .build();

                when(authService.login(any(AuthRequest.class))).thenReturn(response);

                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").value("jwt-token"))
                                .andExpect(jsonPath("$.refreshToken").value("refresh-token"));
        }

        @Test
        void login_InvalidCredentials_ReturnsUnauthorized() throws Exception {
                AuthRequest request = AuthRequest.builder()
                                .email("test@example.com")
                                .password("wrong")
                                .build();

                when(authService.login(any(AuthRequest.class)))
                                .thenThrow(new BadCredentialsException("Invalid credentials"));

                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isUnauthorized())
                                .andExpect(jsonPath("$.message").value("Credenciales inválidas"));
        }

        @Test
        void refresh_Success() throws Exception {
                RefreshRequest request = RefreshRequest.builder()
                                .refreshToken("valid-refresh-token")
                                .build();

                AuthResponse response = AuthResponse.builder()
                                .token("new-jwt-token")
                                .refreshToken("valid-refresh-token")
                                .build();

                when(authService.refresh(anyString())).thenReturn(response);

                mockMvc.perform(post("/api/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").value("new-jwt-token"))
                                .andExpect(jsonPath("$.refreshToken").value("valid-refresh-token"));
        }

        @Test
        void refresh_InvalidToken_ReturnsBadRequest() throws Exception {
                RefreshRequest request = RefreshRequest.builder()
                                .refreshToken("invalid-token")
                                .build();

                when(authService.refresh(anyString()))
                                .thenThrow(new BadRequestException("Refresh token inválido"));

                mockMvc.perform(post("/api/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("Refresh token inválido"));
        }

        @Test
        void logout_Success() throws Exception {
                RefreshRequest request = RefreshRequest.builder()
                                .refreshToken("valid-refresh-token")
                                .build();

                doNothing().when(authService).logout(anyString());

                mockMvc.perform(post("/api/auth/logout")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk());
        }
}
