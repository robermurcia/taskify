package com.taskify.task.dto;

import com.taskify.task.model.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TaskRequestDTO {

    @NotBlank
    @Size(max = 60)
    private String title;

    @Size(max = 500)
    private String description;

    private String taskDate;

    private Priority priority = Priority.MEDIUM;

    private boolean repeatWeekly = false;
}
