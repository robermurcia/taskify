import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page, Task, TaskRequest } from './models/task.models';

@Injectable({
    providedIn: 'root'
})
export class TaskService {

    private readonly apiUrl = `${environment.apiUrl}/tasks`;

    constructor(private http: HttpClient) { }

    list(completed?: boolean, priority?: string, page = 0, size = 20): Observable<Page<Task>> {
        let params = new HttpParams()
            .set('page', page)
            .set('size', size);

        if (completed !== undefined) {
            params = params.set('completed', completed);
        }
        if (priority) {
            params = params.set('priority', priority);
        }

        return this.http.get<Page<Task>>(this.apiUrl, { params });
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
