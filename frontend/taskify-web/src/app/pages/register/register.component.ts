import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, TimeoutError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Component({ selector: 'app-register', standalone: true, imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './register.component.html', styleUrl: './register.component.scss' })
export class RegisterComponent {
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    readonly reason = inject(ActivatedRoute).snapshot.queryParamMap.get('reason');
    readonly form = inject(FormBuilder).nonNullable.group({
        name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(60)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.pattern(/\S/), Validators.minLength(6)]]
    });
    error = '';
    loading = false;

    onSubmit(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid || this.loading) return;
        this.loading = true;
        this.error = '';
        const value = this.form.getRawValue();
        this.auth.register({ ...value, email: value.email.trim(), name: value.name.trim() }).pipe(
            takeUntilDestroyed(this.destroyRef), finalize(() => this.loading = false)
        ).subscribe({
            next: () => { void this.router.navigate(['/']); },
            error: (error: unknown) => {
                this.error = error instanceof TimeoutError ? 'No pudimos confirmar el registro a tiempo. Prueba a iniciar sesión antes de volver a crear la cuenta.'
                    : error instanceof HttpErrorResponse && error.status === 0
                    ? 'No se ha podido conectar. Comprueba tu conexión y vuelve a intentarlo.'
                    : error instanceof HttpErrorResponse && error.status === 400 ? 'No se pudo crear la cuenta. Comprueba los datos o inicia sesión si ya estás registrado.' : 'No pudimos crear tu cuenta. Inténtalo de nuevo.';
            }
        });
    }
}
