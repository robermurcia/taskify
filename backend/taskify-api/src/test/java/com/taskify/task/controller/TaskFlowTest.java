package com.taskify.task.controller;

import com.taskify.auth.jwt.JwtFilter;
import com.taskify.auth.jwt.JwtService;
import com.taskify.config.SecurityConfig;
import com.taskify.task.model.Task;
import com.taskify.task.repository.TaskRepository;
import com.taskify.task.service.TaskService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import java.util.ArrayList;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TaskController.class)
@Import({SecurityConfig.class, JwtFilter.class, JwtService.class, TaskService.class})
class TaskFlowTest {
    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @MockitoBean TaskRepository repository;
    @MockitoBean UserDetailsService users;

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        String key = java.util.Base64.getEncoder().encodeToString(
                io.jsonwebtoken.security.Keys.secretKeyFor(io.jsonwebtoken.SignatureAlgorithm.HS256).getEncoded());
        registry.add("jwt.secret", () -> key);
    }

    @Test
    void createsThenListsAndReloadsThroughRealSecurityControllerAndService() throws Exception {
        var stored = new ArrayList<Task>();
        when(repository.save(any(Task.class))).thenAnswer(call -> {
            Task task = call.getArgument(0);
            task.setId("created-task");
            stored.add(task);
            return task;
        });
        when(repository.findByUserId(eq("demo@example.com"), any(Pageable.class))).thenAnswer(call ->
                new PageImpl<>(stored, call.getArgument(1), stored.size()));
        String bearer = "Bearer " + jwt.generateToken("demo@example.com");
        mvc.perform(post("/api/tasks").header("Authorization", bearer).contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Demo task\",\"taskDate\":\"2026-09-26\",\"priority\":\"LOW\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value("created-task"));
        for (int reload = 0; reload < 2; reload++) {
            mvc.perform(get("/api/tasks?page=0&size=50&sort=id,asc").header("Authorization", bearer))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].title").value("Demo task"))
                    .andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.last").value(true));
        }
        verify(repository, times(1)).save(any());
        verify(repository, times(2)).findByUserId(eq("demo@example.com"), any());
    }
}
