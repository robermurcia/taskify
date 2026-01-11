package com.taskify.task.repository;

import com.taskify.task.model.Priority;
import com.taskify.task.model.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskRepository extends MongoRepository<Task, String> {

    Page<Task> findByUserId(String userId, Pageable pageable);

    Page<Task> findByUserIdAndCompleted(String userId, boolean completed, Pageable pageable);

    Page<Task> findByUserIdAndPriority(String userId, Priority priority, Pageable pageable);

    Page<Task> findByUserIdAndCompletedAndPriority(String userId, boolean completed, Priority priority,
            Pageable pageable);

    Page<Task> findByUserIdAndTaskDate(String userId, String taskDate, Pageable pageable);
}
