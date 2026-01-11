package com.taskify.task.service;

import com.taskify.exception.BadRequestException;
import com.taskify.exception.ResourceNotFoundException;
import com.taskify.task.dto.TaskRequestDTO;
import com.taskify.task.model.Priority;
import com.taskify.task.model.Task;
import com.taskify.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository repository;

    public List<Task> list(String userId) {
        return repository.findAllByUserIdOrderByTaskDateAsc(userId);
    }

    public List<Task> listToday(String userId) {
        String today = LocalDate.now().toString();
        return repository.findAllByUserIdAndTaskDateOrderByTaskDateAsc(userId, today);
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

    public List<Task> listByPriority(String userId, String priority) {
        try {
            Priority enumValue = Priority.valueOf(priority.toUpperCase());
            return repository.findAllByUserIdAndPriorityOrderByTaskDateAsc(userId, enumValue);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid priority: " + priority);
        }
    }

    public List<Task> listByCompleted(String userId, boolean completed) {
        return repository.findAllByUserIdAndCompletedOrderByTaskDateAsc(userId, completed);
    }
}
