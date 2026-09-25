import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';

@Component({
    selector: 'app-modal', standalone: true,
    template: `
        <dialog #dialog aria-labelledby="modal-title" (cancel)="cancel($event)" (click)="backdrop($event)">
            <header class="modal-heading"><h2 id="modal-title">{{ title }}</h2>
                <button type="button" class="icon-button" aria-label="Cerrar ventana" [disabled]="busy" (click)="dismiss.emit()">
                    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M6 18 18 6" /></svg>
                </button>
            </header>
            <ng-content />
        </dialog>`,
    styleUrl: './modal.component.scss'
})
export class ModalComponent implements AfterViewInit, OnDestroy {
    @Input({ required: true }) title = '';
    @Input() busy = false;
    @Output() dismiss = new EventEmitter<void>();
    @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>;
    private previousFocus = document.activeElement;
    private previousOverflow = document.body.style.overflow;

    ngAfterViewInit(): void {
        this.dialog.nativeElement.showModal();
        document.body.style.overflow = 'hidden';
    }
    cancel(event: Event): void {
        event.preventDefault();
        if (!this.busy) this.dismiss.emit();
    }
    backdrop(event: MouseEvent): void {
        if (event.target !== this.dialog.nativeElement) return;
        const rect = this.dialog.nativeElement.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
            this.cancel(event);
        }
    }
    ngOnDestroy(): void {
        this.dialog.nativeElement.close();
        document.body.style.overflow = this.previousOverflow;
        if (this.previousFocus instanceof HTMLElement && this.previousFocus.isConnected) this.previousFocus.focus();
    }
}
