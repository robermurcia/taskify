package com.taskify.task.controller;

import com.taskify.task.dto.TaskRequestDTO;
import com.taskify.task.dto.TaskResponseDTO;
import com.taskify.task.model.Task;
import com.taskify.task.service.TaskService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "Tareas", description = "Operaciones de gestión de tareas")
public class TaskController {

    private final TaskService service;

    @GetMapping
    @Operation(summary = "Listar tareas", description = "Devuelve tareas con paginación, ordenación y filtros opcionales (completed, priority)")
    public Page<Task> list(
            Principal principal,
            @RequestParam(required = false) Boolean completed,
            @RequestParam(required = false) String priority,
            Pageable pageable) {
        return service.list(principal.getName(), completed, priority, pageable);
    }

    @GetMapping("/today")
    @Operation(summary = "Listar tareas de hoy", description = "Devuelve las tareas programadas para hoy con paginación")
    public Page<Task> listToday(Principal principal, Pageable pageable) {
        return service.listToday(principal.getName(), pageable);
    }

    @PostMapping
    @Operation(summary = "Crear tarea", description = "Crea una nueva tarea")
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
    @Operation(summary = "Actualizar tarea", description = "Actualiza los detalles de una tarea existente")
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
    @Operation(summary = "Eliminar tarea", description = "Elimina una tarea por su ID")
    public void delete(@PathVariable String id, Principal principal) {
        service.delete(id, principal.getName());
    }

    @PutMapping("/{id}/complete")
    @Operation(summary = "Completar/Descompletar tarea", description = "Marca una tarea como completada o pendiente")
    public Task complete(@PathVariable String id, @RequestParam boolean completed, Principal principal) {
        return service.toggleComplete(id, principal.getName(), completed);
    }
}
