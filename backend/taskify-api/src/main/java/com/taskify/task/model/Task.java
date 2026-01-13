package com.taskify.task.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "tasks")
@CompoundIndexes({
        @CompoundIndex(name = "uid_date_idx", def = "{'userId': 1, 'taskDate': 1}")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    private String id;

    @Indexed
    private String userId;

    @NotBlank
    @Size(max = 60)
    private String title;

    @Size(max = 500)
    private String description;

    @Field("taskDate")
    private String taskDate;

    @Builder.Default
    private boolean completed = false;

    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    @Builder.Default
    private List<String> repeatDays = new ArrayList<>();

    @Builder.Default
    private List<String> excludedDates = new ArrayList<>();

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}