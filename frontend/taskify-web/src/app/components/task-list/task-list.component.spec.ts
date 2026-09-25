import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { TaskListComponent } from './task-list.component';
import { TaskService } from '../../core/tasks/task.service';
import { Task } from '../../core/tasks/models/task.models';

describe('TaskListComponent mutations', () => {
    let component: TaskListComponent; let service: jasmine.SpyObj<TaskService>;
    const task: Task = { id: '1', title: 'Recurrente', completed: false, priority: 'MEDIUM', taskDate: '2026-09-24', repeatDays: ['THURSDAY'], excludedDates: [], createdAt: '', updatedAt: '' };
    beforeEach(() => {
        service = jasmine.createSpyObj<TaskService>('TaskService', ['listAll', 'create', 'update', 'delete', 'excludeDate', 'toggleComplete']);
        service.listAll.and.returnValue(of([task]));
        TestBed.configureTestingModule({ providers: [{ provide: TaskService, useValue: service }] });
        component = TestBed.runInInjectionContext(() => new TaskListComponent()); component.ngOnInit(); component.selectedDate = '2026-09-24';
    });
    it('opening the delete modal never deletes and confirmation cannot run twice', () => {
        const response = new Subject<void>(); service.delete.and.returnValue(response);
        component.deleteTask(task); expect(service.delete).not.toHaveBeenCalled();
        component.confirmDelete(); component.confirmDelete(); expect(service.delete).toHaveBeenCalledTimes(1);
        response.next(); response.complete(); expect(component.allTasks).toEqual([]); expect(component.taskToDelete).toBeNull();
    });
    it('omits only the selected date and preserves the weekly task', () => {
        service.excludeDate.and.returnValue(of({ ...task, excludedDates: ['2026-09-24'] }));
        component.deleteTask(task); component.confirmDelete(true);
        expect(service.excludeDate).toHaveBeenCalledOnceWith('1', '2026-09-24'); expect(service.delete).not.toHaveBeenCalled();
        expect(component.dayTasks.length).toBe(0); component.selectDate('2026-10-01'); expect(component.dayTasks.length).toBe(1);
    });
    it('keeps edits on errors and prevents duplicate saves', () => {
        const response = new Subject<Task>(); service.update.and.returnValue(response); component.openForm(task);
        component.saveTask({ title: 'Editada' }); component.saveTask({ title: 'Editada' });
        expect(service.update).toHaveBeenCalledTimes(1); response.error(new Error('Offline'));
        expect(component.showForm).toBeTrue(); expect(component.formError).not.toBe(''); expect(component.saving).toBeFalse();
    });
    it('clamps pagination after deleting the last task on a page', () => {
        component.allTasks = Array.from({ length: 9 }, (_, i) => ({ ...task, id: String(i) })); component.currentPage = 2;
        service.delete.and.returnValue(of(undefined)); component.deleteTask(component.allTasks[8]); component.confirmDelete();
        expect(component.currentPage).toBe(1); expect(component.visibleTasks.length).toBe(8);
    });
    it('serializes completion changes per task and restores controls after failure', () => {
        const response = new Subject<Task>(); service.toggleComplete.and.returnValue(response);
        component.toggleComplete(task); component.toggleComplete(task); expect(service.toggleComplete).toHaveBeenCalledTimes(1);
        response.error(new Error('Offline')); expect(component.pendingIds.size).toBe(0); expect(component.allTasks[0].completed).toBeFalse();
    });
});
