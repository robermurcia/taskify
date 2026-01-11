package com.taskify.task.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskify.auth.jwt.JwtFilter;
import com.taskify.exception.ResourceNotFoundException;
import com.taskify.task.dto.TaskRequestDTO;
import com.taskify.task.model.Priority;
import com.taskify.task.model.Task;
import com.taskify.task.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TaskController.class)
@AutoConfigureMockMvc(addFilters = false)
class TaskControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @MockBean
        private TaskService taskService;

        @MockBean
        private JwtFilter jwtFilter;

        @MockBean
        private UserDetailsService userDetailsService;

        private Task task;
        private TaskRequestDTO taskRequestDTO;

        @BeforeEach
        void setUp() {
                task = Task.builder()
                                .id("task-1")
                                .title("Test Task")
                                .description("Description")
                                .taskDate(LocalDate.now().toString())
                                .priority(Priority.LOW)
                                .userId("user")
                                .build();

                taskRequestDTO = TaskRequestDTO.builder()
                                .title("Test Task")
                                .description("Description")
                                .taskDate(LocalDate.now().toString())
                                .priority(Priority.LOW)
                                .build();
        }

        @Test
        void list_ReturnsTasks() throws Exception {
                Page<Task> taskPage = new PageImpl<>(Arrays.asList(task));
                when(taskService.list(eq("test@example.com"), any(), any(), any(Pageable.class))).thenReturn(taskPage);

                mockMvc.perform(get("/api/tasks").principal(() -> "test@example.com"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].title").value("Test Task"));
        }

        @Test
        void create_ReturnsCreatedTask() throws Exception {
                when(taskService.create(any(TaskRequestDTO.class), eq("test@example.com"))).thenReturn(task);

                mockMvc.perform(post("/api/tasks")
                                .principal(() -> "test@example.com")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(taskRequestDTO)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.title").value("Test Task"));
        }

        @Test
        void create_InvalidData_ReturnsBadRequest() throws Exception {
                TaskRequestDTO invalid = TaskRequestDTO.builder().build();

                mockMvc.perform(post("/api/tasks")
                                .principal(() -> "test@example.com")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(invalid)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void update_ReturnsUpdatedTask() throws Exception {
                when(taskService.update(eq("task-1"), any(TaskRequestDTO.class), eq("test@example.com")))
                                .thenReturn(task);

                mockMvc.perform(put("/api/tasks/{id}", "task-1")
                                .principal(() -> "test@example.com")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(taskRequestDTO)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.title").value("Test Task"));
        }

        @Test
        void update_NotFound_ReturnsNotFound() throws Exception {
                when(taskService.update(eq("task-1"), any(TaskRequestDTO.class), eq("test@example.com")))
                                .thenThrow(new ResourceNotFoundException("Task not found"));

                mockMvc.perform(put("/api/tasks/{id}", "task-1")
                                .principal(() -> "test@example.com")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(taskRequestDTO)))
                                .andExpect(status().isNotFound());
        }

        @Test
        void delete_ReturnsOk() throws Exception {
                doNothing().when(taskService).delete("task-1", "test@example.com");

                mockMvc.perform(delete("/api/tasks/{id}", "task-1").principal(() -> "test@example.com"))
                                .andExpect(status().isOk());
        }
}
