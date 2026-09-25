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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaskController.class)
@Import({SecurityConfig.class, JwtFilter.class, JwtService.class})
class SecurityConfigTest {
    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwt;
    @MockitoBean private TaskService tasks;
    @MockitoBean private UserDetailsService users;

    @Test
    void missingOrInvalidJwtReturns401() throws Exception {
        mvc.perform(get("/api/tasks")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/tasks").header("Authorization", "Bearer invalid"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void validJwtCanAccessOwnTasks() throws Exception {
        when(tasks.list(eq("test@example.com"), isNull(), isNull(), any())).thenReturn(Page.empty());
        mvc.perform(get("/api/tasks").header("Authorization", "Bearer " + jwt.generateToken("test@example.com")))
                .andExpect(status().isOk());
    }
}
