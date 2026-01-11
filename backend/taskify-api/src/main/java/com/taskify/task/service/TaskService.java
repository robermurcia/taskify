package com.taskify.task.service;

import com.taskify.exception.BadRequestException;
import com.taskify.exception.ResourceNotFoundException;
import com.taskify.task.dto.TaskRequestDTO;
import com.taskify.task.model.Priority;
import com.taskify.task.model.Task;
import com.taskify.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository repository;

    public Page<Task> list(String userId, Boolean completed, String priority, Pageable pageable) {
        Priority priorityEnum = null;
        if (priority != null && !priority.isBlank()) {
            try {
                priorityEnum = Priority.valueOf(priority.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid priority: " + priority);
            }
        }

        if (completed != null && priorityEnum != null) {
            return repository.findByUserIdAndCompletedAndPriority(userId, completed, priorityEnum, pageable);
        } else if (completed != null) {
            return repository.findByUserIdAndCompleted(userId, completed, pageable);
        } else if (priorityEnum != null) {
            return repository.findByUserIdAndPriority(userId, priorityEnum, pageable);
        } else {
            return repository.findByUserId(userId, pageable);
        }
    }

    public Page<Task> listToday(String userId, Pageable pageable) {
        String today = LocalDate.now().toString();
        return repository.findByUserIdAndTaskDate(userId, today, pageable);
    }

    public Task create(TaskRequestDTO dto, String userId) {
        Task task = Task.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .taskDate(dto.getTaskDate())
                .priority(dto.getPriority())
                .repeatWeekly(dto.isRepeatWeekly())
                .userId(userId)
                .build();

        return repository.save(task);
    }

    public Task update(String id, TaskRequestDTO dto, String userId) {
        Task task = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        if (!task.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Task not found with id: " + id);
        }

        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setTaskDate(dto.getTaskDate());
        task.setPriority(dto.getPriority());
        task.setRepeatWeekly(dto.isRepeatWeekly());
        return repository.save(task);
    }

    public void delete(String id, String userId) {
        Task task = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        if (!task.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Task not found with id: " + id);
        }

        repository.deleteById(id);
    }

    public Task toggleComplete(String id, String userId, boolean completed) {
        Task task = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        if (!task.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Task not found with id: " + id);
        }

        task.setCompleted(completed);
        return repository.save(task);
    }
}
