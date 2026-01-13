package com.taskify.task.dto;

import com.taskify.task.model.Priority;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TaskResponseDTO {
    private String id;
    private String title;
    private String description;
    private String taskDate;
    private boolean completed;
    private Priority priority;
    private List<String> repeatDays;
    private List<String> excludedDates;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}