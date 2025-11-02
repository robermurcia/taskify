package com.taskify.task.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Document(collection = "tasks")
@CompoundIndexes({
    @CompoundIndex(name = "uid_date_idx", def = "{'userId': 1, 'date': 1}")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
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

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    @Builder.Default
    private boolean completed = false;

    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    @Builder.Default
    private boolean repeatWeekly = false;

    @CreatedDate
    private OffsetDateTime createdAt;

    @LastModifiedDate
    private OffsetDateTime updatedAt;
}