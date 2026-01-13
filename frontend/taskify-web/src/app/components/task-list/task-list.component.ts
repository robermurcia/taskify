import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../core/tasks/task.service';
import { Task, TaskRequest, Priority, DayOfWeek } from '../../core/tasks/models/task.models';
import { FormsModule } from '@angular/forms';
import { LowerCasePipe } from '@angular/common';

interface DayItem {
    date: Date;
    dateStr: string; // formato YYYY-MM-DD para comparar con taskDate
    dayName: string;
    dayNumber: number;
    monthShort: string;
    isToday: boolean;
}

@Component({
    selector: 'app-task-list',
    standalone: true,
    imports: [FormsModule, LowerCasePipe],
    templateUrl: './task-list.component.html',
    styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
    allTasks: Task[] = [];
    filteredTasks: Task[] = [];
    loading = false;
    error = '';

    // Calendario de días
    days: DayItem[] = [];
    selectedDay: DayItem | null = null;
    weekOffset = 0; // 0 = primera semana, 1 = segunda semana

    get visibleDays(): DayItem[] {
        const start = this.weekOffset * 7;
        return this.days.slice(start, start + 7);
    }

    get canGoPrev(): boolean {
        return this.weekOffset > 0;
    }

    get canGoNext(): boolean {
        return this.weekOffset < 1;
    }

    // Formulario de nueva tarea
    showForm = false;
    newTask: TaskRequest = {
        title: '',
        description: '',
        priority: 'MEDIUM',
        taskDate: '',
        repeatDays: []
    };
    saving = false;

    // Edición
    editingTask: Task | null = null;

    // Modal de eliminación
    showDeleteModal = false;
    taskToDelete: Task | null = null;

    constructor(private taskService: TaskService) { }

    ngOnInit(): void {
        this.generateDays();
        this.loadTasks();
    }

    generateDays(): void {
        const today = new Date();
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        // Generar 14 días a partir de hoy (2 semanas)
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            const dayItem: DayItem = {
                date: date,
                dateStr: this.formatDateToStr(date),
                dayName: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : dayNames[date.getDay()],
                dayNumber: date.getDate(),
                monthShort: monthNames[date.getMonth()],
                isToday: i === 0
            };

            this.days.push(dayItem);
        }

        // Seleccionar hoy por defecto
        this.selectedDay = this.days[0];
    }

    prevWeek(): void {
        if (this.canGoPrev) {
            this.weekOffset--;
        }
    }

    nextWeek(): void {
        if (this.canGoNext) {
            this.weekOffset++;
        }
    }

    formatDateToStr(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    selectDay(day: DayItem): void {
        this.selectedDay = day;
        this.filterTasksByDay();
    }

    loadTasks(): void {
        this.loading = true;
        this.error = '';

        this.taskService.list().subscribe({
            next: (page) => {
                this.allTasks = page.content;
                this.filterTasksByDay();
                this.loading = false;
            },
            error: () => {
                this.error = 'Error al cargar las tareas';
                this.loading = false;
            }
        });
    }

    filterTasksByDay(): void {
        if (!this.selectedDay) {
            this.filteredTasks = this.allTasks;
            return;
        }

        const selectedDayOfWeek = this.selectedDay.date.getDay();

        this.filteredTasks = this.allTasks.filter(task => {
            const dateStr = this.selectedDay!.dateStr;

            // Verificar si esta fecha está excluida
            if (task.excludedDates && task.excludedDates.includes(dateStr)) {
                return false;
            }

            // Tarea exacta para ese día
            if (task.taskDate === dateStr) {
                return true;
            }
            // Tarea con repetición: mostrar si el día de la semana está en repeatDays
            if (task.repeatDays && task.repeatDays.length > 0) {
                const dayName = this.getDayOfWeekName(selectedDayOfWeek);
                return task.repeatDays.includes(dayName);
            }
            return false;
        });
    }

    getTaskCountForDay(day: DayItem): number {
        const dayOfWeek = day.date.getDay();

        return this.allTasks.filter(task => {
            // Verificar si esta fecha está excluida
            if (task.excludedDates && task.excludedDates.includes(day.dateStr)) {
                return false;
            }

            if (task.taskDate === day.dateStr) {
                return true;
            }
            if (task.repeatDays && task.repeatDays.length > 0) {
                const dayName = this.getDayOfWeekName(dayOfWeek);
                return task.repeatDays.includes(dayName);
            }
            return false;
        }).length;
    }

    openForm(): void {
        this.showForm = true;
        this.editingTask = null;
        this.resetForm();
        // Pre-seleccionar la fecha del día seleccionado
        if (this.selectedDay) {
            this.newTask.taskDate = this.selectedDay.dateStr;
        }
    }

    closeForm(): void {
        this.showForm = false;
        this.editingTask = null;
        this.resetForm();
    }

    resetForm(): void {
        this.newTask = {
            title: '',
            description: '',
            priority: 'MEDIUM',
            taskDate: this.selectedDay?.dateStr || '',
            repeatDays: []
        };
    }

    saveTask(): void {
        if (!this.newTask.title.trim()) return;

        this.saving = true;

        if (this.editingTask) {
            this.taskService.update(this.editingTask.id, this.newTask).subscribe({
                next: () => {
                    this.loadTasks();
                    this.closeForm();
                    this.saving = false;
                },
                error: () => {
                    this.error = 'Error al actualizar la tarea';
                    this.saving = false;
                }
            });
        } else {
            this.taskService.create(this.newTask).subscribe({
                next: () => {
                    this.loadTasks();
                    this.closeForm();
                    this.saving = false;
                },
                error: () => {
                    this.error = 'Error al crear la tarea';
                    this.saving = false;
                }
            });
        }
    }

    editTask(task: Task): void {
        this.editingTask = task;
        this.newTask = {
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            taskDate: task.taskDate || '',
            repeatDays: task.repeatDays || []
        };
        this.showForm = true;
    }

    deleteTask(task: Task): void {
        // Si la tarea tiene repeticiones, mostrar modal con opciones
        if (task.repeatDays && task.repeatDays.length > 0) {
            this.taskToDelete = task;
            this.showDeleteModal = true;
        } else {
            // Tarea sin repeticiones: confirmar y eliminar directamente
            if (!confirm(`¿Eliminar "${task.title}"?`)) return;
            this.confirmDeleteAll();
            this.taskToDelete = task;
            this.confirmDeleteAll();
        }
    }

    closeDeleteModal(): void {
        this.showDeleteModal = false;
        this.taskToDelete = null;
    }

    confirmDeleteAll(): void {
        if (!this.taskToDelete) return;

        this.taskService.delete(this.taskToDelete.id).subscribe({
            next: () => {
                this.loadTasks();
                this.closeDeleteModal();
            },
            error: () => this.error = 'Error al eliminar la tarea'
        });
    }

    excludeThisDate(): void {
        if (!this.taskToDelete || !this.selectedDay) return;

        this.taskService.excludeDate(this.taskToDelete.id, this.selectedDay.dateStr).subscribe({
            next: (updated) => {
                const index = this.allTasks.findIndex(t => t.id === updated.id);
                if (index !== -1) {
                    this.allTasks[index] = updated;
                    this.filterTasksByDay();
                }
                this.closeDeleteModal();
            },
            error: () => this.error = 'Error al excluir la fecha'
        });
    }

    toggleComplete(task: Task): void {
        this.taskService.toggleComplete(task.id, !task.completed).subscribe({
            next: (updated) => {
                const index = this.allTasks.findIndex(t => t.id === task.id);
                if (index !== -1) {
                    this.allTasks[index] = updated;
                    this.filterTasksByDay();
                }
            },
            error: () => this.error = 'Error al actualizar la tarea'
        });
    }

    getPriorityLabel(priority: Priority): string {
        const labels = { HIGH: 'Alta', MEDIUM: 'Media', LOW: 'Baja' };
        return labels[priority];
    }

    getDayOfWeekName(dayIndex: number): DayOfWeek {
        const days: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        return days[dayIndex];
    }

    toggleRepeatDay(day: DayOfWeek): void {
        if (!this.newTask.repeatDays) {
            this.newTask.repeatDays = [];
        }
        const index = this.newTask.repeatDays.indexOf(day);
        if (index === -1) {
            this.newTask.repeatDays.push(day);
        } else {
            this.newTask.repeatDays.splice(index, 1);
        }
    }

    isRepeatDaySelected(day: DayOfWeek): boolean {
        return this.newTask.repeatDays?.includes(day) || false;
    }
}
