package com.taskify.task.controller;

import com.taskify.task.dto.TaskRequestDTO;
import com.taskify.task.dto.TaskResponseDTO;
import com.taskify.task.model.Task;
import com.taskify.task.service.TaskService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService service;

    @GetMapping
    public List<Task> list(Principal principal) {
        return service.list(principal.getName());
    }

    @GetMapping("/today")
    public List<Task> listToday(Principal principal) {
        return service.listToday(principal.getName());
    }

    @PostMapping
    public TaskResponseDTO create(@RequestBody @Valid TaskRequestDTO dto, Principal principal) {
        Task created = service.create(dto, principal.getName());
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
    public TaskResponseDTO update(@PathVariable String id, @RequestBody @Valid TaskRequestDTO dto,
            Principal principal) {

        Task updated = service.update(id, dto, principal.getName());

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
    public void delete(@PathVariable String id, Principal principal) {
        service.delete(id, principal.getName());
    }

    @PutMapping("/{id}/complete")
    public Task complete(@PathVariable String id, @RequestParam boolean completed, Principal principal) {
        return service.toggleComplete(id, principal.getName(), completed);
    }

    @GetMapping("/priority")
    public List<Task> listByPriority(Principal principal, @RequestParam String value) {
        return service.listByPriority(principal.getName(), value);
    }

    @GetMapping("/completed")
    public List<Task> listByCompleted(Principal principal, @RequestParam boolean value) {
        return service.listByCompleted(principal.getName(), value);
    }
}