export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface TaskRequest {
    title: string;
    description?: string;
    taskDate?: string;
    priority?: Priority;
    repeatDays?: DayOfWeek[];
}

export interface Task {
    id: string;
    title: string;
    description?: string | null;
    taskDate?: string | null;
    completed: boolean;
    priority: Priority;
    repeatDays: DayOfWeek[] | null;
    excludedDates: string[] | null;
    createdAt: string;
    updatedAt: string;
}

export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
}
