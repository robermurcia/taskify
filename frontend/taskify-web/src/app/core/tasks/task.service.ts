import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page, Priority, Task, TaskRequest } from './models/task.models';

@Injectable({
    providedIn: 'root'
})
export class TaskService {

    private readonly apiUrl = `${environment.apiUrl}/tasks`;

    constructor(private http: HttpClient) { }

    list(completed?: boolean, priority?: Priority, page = 0, size = 50): Observable<Page<Task>> {
        let params = new HttpParams()
            .set('page', page)
            .set('size', size)
            .set('sort', 'id,asc');

        if (completed !== undefined) {
            params = params.set('completed', completed);
        }
        if (priority) {
            params = params.set('priority', priority);
        }

        return this.http.get<Page<Task>>(this.apiUrl, { params });
    }

    // No date-range/recurrence query exists: read every bounded page before filtering.
    listAll(): Observable<Task[]> {
        return this.list().pipe(
            expand(page => page.last || page.number + 1 >= page.totalPages
                ? EMPTY : this.list(undefined, undefined, page.number + 1)),
            reduce((tasks, page) => tasks.concat(page.content), [] as Task[]),
            map(tasks => [...new Map(tasks.map(task => [task.id, task])).values()])
        );
    }

    listToday(page = 0, size = 20): Observable<Page<Task>> {
        const params = new HttpParams()
            .set('page', page)
            .set('size', size);

        return this.http.get<Page<Task>>(`${this.apiUrl}/today`, { params });
    }

    create(task: TaskRequest): Observable<Task> {
        return this.http.post<Task>(this.apiUrl, task);
    }

    update(id: string, task: TaskRequest): Observable<Task> {
        return this.http.put<Task>(`${this.apiUrl}/${id}`, task);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    toggleComplete(id: string, completed: boolean): Observable<Task> {
        const params = new HttpParams().set('completed', completed);
        return this.http.put<Task>(`${this.apiUrl}/${id}/complete`, null, { params });
    }

    excludeDate(id: string, date: string): Observable<Task> {
        const params = new HttpParams().set('date', date);
        return this.http.put<Task>(`${this.apiUrl}/${id}/exclude`, null, { params });
    }
}
