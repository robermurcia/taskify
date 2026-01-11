package com.taskify.task.dto;

import com.taskify.task.model.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskRequestDTO {

    @NotBlank
    @Size(max = 60)
    private String title;

    @Size(max = 500)
    private String description;

    private String taskDate;

    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    @Builder.Default
    private boolean repeatWeekly = false;
}
