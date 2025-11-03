package com.taskify.task.controller;

import com.taskify.task.dto.TaskRequestDTO;
import com.taskify.task.dto.TaskResponseDTO;
import com.taskify.task.model.Task;
import com.taskify.task.service.TaskService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService service;

    // Simulamos usuario con header X-User-Id (hasta tener JWT)
    private String getUserId(HttpServletRequest req) {
        String userId = req.getHeader("X-User-Id");
        return (userId != null && !userId.isEmpty()) ? userId : "demo-user";
    }

    @GetMapping
    public List<Task> list(HttpServletRequest req) {
        return service.list(getUserId(req));
    }

    @GetMapping("/today")
    public List<Task> listToday(HttpServletRequest req) {
        return service.listToday(getUserId(req));
    }

    @PostMapping
    public TaskResponseDTO create(@RequestBody @Valid TaskRequestDTO dto, HttpServletRequest req) {
        Task created = service.create(dto, getUserId(req));
        return TaskResponseDTO.builder()
                .id(created.getId())
                .title(created.getTitle())
                .description(created.getDescription())
                .taskDate(created.getTaskDate())
                .completed(created.isCompleted())
                .priority(created.getPriority())
                .repeatWeekly(created.isRepeatWeekly())
                .createdAt(created.getCreatedAt())
                .updatedAt(created.getUpdatedAt())
                .build();
    }

    @PutMapping("/{id}")
    public TaskResponseDTO update(@PathVariable String id, @RequestBody @Valid TaskRequestDTO dto, HttpServletRequest req) {

        Task updated = service.update(id, dto, getUserId(req));

        return TaskResponseDTO.builder()
                .id(updated.getId())
                .title(updated.getTitle())
                .description(updated.getDescription())
                .taskDate(updated.getTaskDate())
                .priority(updated.getPriority())
                .completed(updated.isCompleted())
                .repeatWeekly(updated.isRepeatWeekly())
                .createdAt(updated.getCreatedAt())
                .updatedAt(updated.getUpdatedAt())
                .build();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id, HttpServletRequest req) {
        service.delete(id, getUserId(req));
    }

    @PutMapping("/{id}/complete")
    public Task complete(@PathVariable String id, @RequestParam boolean completed, HttpServletRequest req) {
        return service.toggleComplete(id, getUserId(req), completed);
    }
}