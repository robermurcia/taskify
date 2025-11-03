package com.taskify.task.repository;

import com.taskify.task.model.Priority;
import com.taskify.task.model.Task;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends MongoRepository<Task, String> {

    List<Task> findAllByUserIdOrderByTaskDateAsc(String userId);

    List<Task> findAllByUserIdAndTaskDateOrderByTaskDateAsc(String userId, String taskDate);

    List<Task> findAllByUserIdAndPriorityOrderByTaskDateAsc(String userId, Priority priority);

    List<Task> findAllByUserIdAndCompletedOrderByTaskDateAsc(String userId, boolean completed);
}
