import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { TaskService } from './task.service';
import { Task } from './models/task.models';

describe('TaskService', () => {
    let service: TaskService;
    let http: HttpTestingController;
    const task: Task = { id: '1', title: 'Task', completed: false, priority: 'LOW', repeatDays: [], excludedDates: [], createdAt: '', updatedAt: '' };
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        service = TestBed.inject(TaskService); http = TestBed.inject(HttpTestingController);
    });
    afterEach(() => http.verify());
    it('loads all bounded pages in stable order and deduplicates IDs', () => {
        let result: Task[] | undefined;
        service.listAll().subscribe(tasks => result = tasks);
        const first = http.expectOne(req => req.url === `${environment.apiUrl}/tasks` && req.params.get('page') === '0');
        expect(first.request.params.get('size')).toBe('50');
        expect(first.request.params.get('sort')).toBe('id,asc');
        first.flush({ content: [task], number: 0, totalPages: 2, last: false });
        expect(result).toBeUndefined();
        http.expectOne(req => req.params.get('page') === '1').flush({ content: [task, { ...task, id: '2' }], number: 1, totalPages: 2, last: true });
        expect(result?.map(item => item.id)).toEqual(['1', '2']);
    });
    it('does not publish a misleading partial calendar when a later page fails', () => {
        const next = jasmine.createSpy('next'); const error = jasmine.createSpy('error');
        service.listAll().subscribe({ next, error });
        http.expectOne(req => req.params.get('page') === '0').flush({ content: [task], number: 0, totalPages: 2, last: false });
        http.expectOne(req => req.params.get('page') === '1').flush({}, { status: 500, statusText: 'Error' });
        expect(next).not.toHaveBeenCalled(); expect(error).toHaveBeenCalled();
    });
    it('uses the real complete and exclude endpoints and local date query', () => {
        service.toggleComplete('1', true).subscribe();
        const complete = http.expectOne(req => req.url.endsWith('/1/complete'));
        expect(complete.request.method).toBe('PUT'); expect(complete.request.params.get('completed')).toBe('true'); complete.flush(task);
        service.excludeDate('1', '2026-09-24').subscribe();
        const exclude = http.expectOne(req => req.url.endsWith('/1/exclude'));
        expect(exclude.request.params.get('date')).toBe('2026-09-24'); exclude.flush(task);
    });

    it('creates once and retrieves the saved task again after a reload', () => {
        service.create({ title: 'Task', priority: 'LOW' }).subscribe(created => expect(created.id).toBe('1'));
        const create = http.expectOne(`${environment.apiUrl}/tasks`);
        expect(create.request.method).toBe('POST');
        create.flush(task);
        for (let reload = 0; reload < 2; reload++) {
            service.listAll().subscribe(tasks => expect(tasks).toEqual([task]));
            const list = http.expectOne(req => req.url === `${environment.apiUrl}/tasks`);
            expect(list.request.method).toBe('GET');
            list.flush({ content: [task], number: 0, totalPages: 1, last: true });
        }
    });
});
