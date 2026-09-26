package com.taskify.task.dto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import java.util.List;

/** Stable representation preserving the existing PageImpl JSON fields. */
public record TaskPageResponse<T>(List<T> content, PageableResponse pageable, boolean last,
        int totalPages, long totalElements, int size, int number, SortResponse sort,
        boolean first, int numberOfElements, boolean empty) {

    public static <T> TaskPageResponse<T> from(Page<T> page) {
        var pageable = page.getPageable();
        var sort = SortResponse.from(page.getSort());
        return new TaskPageResponse<>(page.getContent(), new PageableResponse(
                page.getNumber(), page.getSize(), sort, pageable.isPaged() ? pageable.getOffset() : 0,
                pageable.isPaged(), pageable.isUnpaged()), page.isLast(), page.getTotalPages(),
                page.getTotalElements(), page.getSize(), page.getNumber(), sort,
                page.isFirst(), page.getNumberOfElements(), page.isEmpty());
    }

    public record PageableResponse(int pageNumber, int pageSize, SortResponse sort, long offset,
            boolean paged, boolean unpaged) {}

    public record SortResponse(boolean empty, boolean sorted, boolean unsorted) {
        static SortResponse from(Sort sort) {
            return new SortResponse(sort.isEmpty(), sort.isSorted(), sort.isUnsorted());
        }
    }
}
