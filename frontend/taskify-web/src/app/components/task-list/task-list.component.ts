import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Observable, finalize } from 'rxjs';
import { TaskService } from '../../core/tasks/task.service';
import { Task, TaskRequest, Priority } from '../../core/tasks/models/task.models';
import { addDays, dateLabel, localDate, occursOn } from '../../core/tasks/task-date';
import { DaySelectorComponent } from '../day-selector/day-selector.component';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskItemComponent } from '../task-item/task-item.component';
import { ModalComponent } from '../modal/modal.component';

type StatusFilter = 'all' | 'pending' | 'completed';

@Component({
    selector: 'app-task-list', standalone: true,
    imports: [FormsModule, DaySelectorComponent, TaskFormComponent, TaskItemComponent, ModalComponent],
    templateUrl: './task-list.component.html', styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit {
    private readonly service = inject(TaskService);
    private readonly destroyRef = inject(DestroyRef);
    allTasks: Task[] = [];
    selectedDate = localDate();
    statusFilter: StatusFilter = 'all';
    priorityFilter: Priority | 'all' = 'all';
    currentPage = 1;
    readonly pageSize = 8;
    loading = false;
    loadError = '';
    actionError = '';
    feedback = '';
    saving = false;
    deleting = false;
    readonly pendingIds = new Set<string>();
    showForm = false;
    editingTask: Task | null = null;
    taskToDelete: Task | null = null;
    formError = '';
    deleteError = '';

    get heading(): string { return this.selectedDate === localDate() ? 'Tu día, con claridad.' : 'Un día a tu ritmo.'; }
    get selectedLabel(): string { return dateLabel(this.selectedDate); }
    get dayTasks(): Task[] { return this.allTasks.filter(task => occursOn(task, this.selectedDate)); }
    get completedCount(): number { return this.dayTasks.filter(task => task.completed).length; }
    get filteredTasks(): Task[] {
        return this.dayTasks.filter(task =>
            (this.statusFilter === 'all' || task.completed === (this.statusFilter === 'completed')) &&
            (this.priorityFilter === 'all' || task.priority === this.priorityFilter));
    }
    get totalPages(): number { return Math.max(1, Math.ceil(this.filteredTasks.length / this.pageSize)); }
    get visibleTasks(): Task[] { return this.filteredTasks.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize); }
    get dayCounts(): Record<string, number> {
        // Cover any 14-day window containing the selected day.
        return Object.fromEntries(Array.from({ length: 27 }, (_, i) => {
            const date = addDays(this.selectedDate, i - 13);
            return [date, this.allTasks.filter(task => occursOn(task, date)).length];
        }));
    }

    ngOnInit(): void { this.loadTasks(); }
    loadTasks(): void {
        if (this.loading) return;
        this.loading = true;
        this.loadError = '';
        this.service.listAll().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading = false)).subscribe({
            next: tasks => { this.allTasks = tasks; this.clampPage(); },
            error: () => this.loadError = 'No pudimos cargar todas tus tareas. Comprueba la conexión y vuelve a intentarlo.'
        });
    }
    selectDate(date: string): void {
        this.selectedDate = date;
        this.currentPage = 1;
        this.statusFilter = 'all';
        this.priorityFilter = 'all';
        this.feedback = '';
    }
    setStatus(filter: StatusFilter): void { this.statusFilter = filter; this.currentPage = 1; }
    openForm(task: Task | null = null): void {
        this.editingTask = task;
        this.formError = '';
        this.showForm = true;
    }
    closeForm(): void { if (!this.saving) { this.showForm = false; this.editingTask = null; } }
    saveTask(request: TaskRequest): void {
        if (this.saving) return;
        this.saving = true;
        this.formError = '';
        const editing = this.editingTask;
        const operation$ = editing ? this.service.update(editing.id, request) : this.service.create(request);
        operation$.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving = false)).subscribe({
            next: task => {
                this.upsert(task);
                this.showForm = false;
                this.editingTask = null;
                this.feedback = occursOn(task, this.selectedDate)
                    ? (editing ? 'Cambios guardados.' : 'Tarea creada.')
                    : 'Tarea guardada en otra fecha. Puedes verla desde el calendario.';
            },
            error: () => this.formError = 'No pudimos guardar la tarea. Tus cambios siguen aquí; inténtalo de nuevo.'
        });
    }
    deleteTask(task: Task): void {
        if (this.pendingIds.has(task.id)) return;
        this.taskToDelete = task;
        this.deleteError = '';
    }
    closeDelete(): void { if (!this.deleting) this.taskToDelete = null; }
    confirmDelete(onlyDate = false): void {
        const task = this.taskToDelete;
        if (!task || this.deleting) return;
        this.deleting = true;
        this.deleteError = '';
        const operation$: Observable<Task | void> = onlyDate ? this.service.excludeDate(task.id, this.selectedDate) : this.service.delete(task.id);
        operation$.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.deleting = false)).subscribe({
            next: updated => {
                if (updated) this.upsert(updated);
                else this.allTasks = this.allTasks.filter(item => item.id !== task.id);
                this.clampPage();
                this.taskToDelete = null;
                this.feedback = onlyDate ? 'Ocurrencia omitida. El resto de la serie se conserva.' : 'Tarea eliminada.';
            },
            error: () => this.deleteError = 'No pudimos eliminar la tarea. Inténtalo de nuevo.'
        });
    }
    toggleComplete(task: Task): void {
        if (this.pendingIds.has(task.id)) return;
        this.pendingIds.add(task.id);
        this.actionError = '';
        this.service.toggleComplete(task.id, !task.completed).pipe(
            takeUntilDestroyed(this.destroyRef), finalize(() => this.pendingIds.delete(task.id))
        ).subscribe({
            next: updated => { this.upsert(updated); this.feedback = updated.completed ? 'Tarea completada.' : 'Tarea marcada como pendiente.'; },
            error: () => this.actionError = 'No se ha cambiado el estado. Vuelve a intentarlo.'
        });
    }
    private upsert(task: Task): void {
        this.allTasks = this.allTasks.some(item => item.id === task.id)
            ? this.allTasks.map(item => item.id === task.id ? task : item) : [...this.allTasks, task];
        this.clampPage();
    }
    private clampPage(): void { this.currentPage = Math.min(this.currentPage, this.totalPages); }
}
