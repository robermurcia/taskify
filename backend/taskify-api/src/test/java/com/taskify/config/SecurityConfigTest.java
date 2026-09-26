package com.taskify.config;

import com.taskify.auth.jwt.JwtFilter;
import com.taskify.auth.jwt.JwtService;
import com.taskify.task.controller.TaskController;
import com.taskify.task.service.TaskService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({TaskController.class, com.taskify.health.HealthController.class})
@Import({SecurityConfig.class, JwtFilter.class, JwtService.class})
class SecurityConfigTest {
    private static final String TEST_SECRET = java.util.Base64.getEncoder().encodeToString(
            io.jsonwebtoken.security.Keys.secretKeyFor(io.jsonwebtoken.SignatureAlgorithm.HS256).getEncoded());

    @DynamicPropertySource
    static void jwtProperties(DynamicPropertyRegistry registry) {
        registry.add("jwt.secret", () -> TEST_SECRET);
        registry.add("cors.allowed-origins", () -> "http://localhost:4200, https://taskify-test.vercel.app");
    }

    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwt;
    @Autowired private org.springframework.security.authentication.AuthenticationManager authenticationManager;
    @Autowired private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    @MockitoBean private TaskService tasks;
    @MockitoBean private UserDetailsService users;

    @Test
    void publicHealthDoesNotRequireJwtAndCannotBeCached() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content()
                        .json("{\"status\":\"UP\"}"));
    }

    @Test
    void authenticationManagerUsesUserDetailsAndBcrypt() {
        when(users.loadUserByUsername("test@example.com")).thenReturn(
                org.springframework.security.core.userdetails.User.withUsername("test@example.com")
                        .password(passwordEncoder.encode("test-password")).roles("USER").build());
        var authenticated = authenticationManager.authenticate(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "test@example.com", "test-password"));
        org.junit.jupiter.api.Assertions.assertTrue(authenticated.isAuthenticated());
        org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.security.authentication.BadCredentialsException.class,
                () -> authenticationManager.authenticate(
                        new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                "test@example.com", "wrong-password")));
    }

    @Test
    void documentationIsNotExposedByDefaultEvenWithAValidJwt() throws Exception {
        for (String path : new String[] { "/swagger-ui/index.html", "/v3/api-docs", "/webjars/swagger-ui/index.html" }) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
            mvc.perform(get(path).header("Authorization", "Bearer " + jwt.generateToken("test@example.com")))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void missingOrInvalidJwtReturns401() throws Exception {
        mvc.perform(get("/api/tasks")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/tasks").header("Authorization", "Bearer invalid"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void permitsConfiguredVercelOriginAndRejectsOtherOrigins() throws Exception {
        mvc.perform(options("/api/tasks").header("Origin", "https://taskify-test.vercel.app")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://taskify-test.vercel.app"));
        mvc.perform(options("/api/tasks").header("Origin", "https://untrusted.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    @Test
    void validJwtCanAccessOwnTasks() throws Exception {
        when(tasks.list(eq("test@example.com"), isNull(), isNull(), any())).thenReturn(Page.empty());
        mvc.perform(get("/api/tasks").header("Authorization", "Bearer " + jwt.generateToken("test@example.com")))
                .andExpect(status().isOk());
    }
}
