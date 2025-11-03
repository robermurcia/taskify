package com.taskify.task.dto;

import com.taskify.task.model.Priority;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TaskResponseDTO {
    private String id;
    private String title;
    private String description;
    private String taskDate;
    private boolean completed;
    private Priority priority;
    private boolean repeatWeekly;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}