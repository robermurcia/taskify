package com.taskify.task.service;

import com.taskify.exception.ResourceNotFoundException;
import com.taskify.task.dto.TaskRequestDTO;
import com.taskify.task.model.Priority;
import com.taskify.task.model.Task;
import com.taskify.task.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository repository;

    @InjectMocks
    private TaskService taskService;

    private Task task;
    private TaskRequestDTO taskRequestDTO;
    private final String userId = "user-123";
    private Pageable pageable;

    @BeforeEach
    void setUp() {
        pageable = PageRequest.of(0, 10);

        task = Task.builder()
                .id("task-1")
                .title("Test Task")
                .description("Description")
                .taskDate(LocalDate.now().toString())
                .priority(Priority.LOW)
                .userId(userId)
                .completed(false)
                .build();

        taskRequestDTO = TaskRequestDTO.builder()
                .title("Updated Task")
                .description("Updated Description")
                .taskDate(LocalDate.now().toString())
                .priority(Priority.HIGH)
                .build();
    }

    @Test
    void list_ReturnsPageOfTasks() {
        Page<Task> taskPage = new PageImpl<>(Arrays.asList(task));
        when(repository.findByUserId(eq(userId), any(Pageable.class))).thenReturn(taskPage);

        Page<Task> result = taskService.list(userId, null, null, pageable);

        assertFalse(result.isEmpty());
        assertEquals(1, result.getTotalElements());
        assertEquals(task.getTitle(), result.getContent().get(0).getTitle());
    }

    @Test
    void create_ReturnsCreatedTask() {
        when(repository.save(any(Task.class))).thenReturn(task);

        Task result = taskService.create(taskRequestDTO, userId);

        assertNotNull(result);
        assertEquals(task.getTitle(), result.getTitle());
        verify(repository).save(any(Task.class));
    }

    @Test
    void update_Success() {
        when(repository.findById("task-1")).thenReturn(Optional.of(task));
        when(repository.save(any(Task.class))).thenReturn(task);

        Task result = taskService.update("task-1", taskRequestDTO, userId);

        assertNotNull(result);
        assertEquals(taskRequestDTO.getTitle(), result.getTitle());
    }

    @Test
    void update_TaskNotFound_ThrowsException() {
        when(repository.findById("task-1")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> taskService.update("task-1", taskRequestDTO, userId));
    }

    @Test
    void update_Forbidden_ThrowsException() {
        task.setUserId("other-user");
        when(repository.findById("task-1")).thenReturn(Optional.of(task));

        assertThrows(ResourceNotFoundException.class, () -> taskService.update("task-1", taskRequestDTO, userId));
    }

    @Test
    void delete_Success() {
        when(repository.findById("task-1")).thenReturn(Optional.of(task));

        taskService.delete("task-1", userId);

        verify(repository).deleteById("task-1");
    }

    @Test
    void toggleComplete_Success() {
        when(repository.findById("task-1")).thenReturn(Optional.of(task));
        when(repository.save(any(Task.class))).thenAnswer(i -> i.getArgument(0));

        Task result = taskService.toggleComplete("task-1", userId, true);

        assertTrue(result.isCompleted());
    }
}
