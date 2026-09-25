import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Component({ selector: 'app-login', standalone: true, imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './login.component.html', styleUrl: './login.component.scss' })
export class LoginComponent {
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    readonly reason = inject(ActivatedRoute).snapshot.queryParamMap.get('reason');
    readonly form = inject(FormBuilder).nonNullable.group({

        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.pattern(/\S/)]]
    });
    error = '';
    loading = false;

    onSubmit(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid || this.loading) return;
        this.loading = true;
        this.error = '';
        const value = this.form.getRawValue();
        this.auth.login({ ...value, email: value.email.trim() }).pipe(
            takeUntilDestroyed(this.destroyRef), finalize(() => this.loading = false)
        ).subscribe({
            next: () => { void this.router.navigate(['/']); },
            error: (error: unknown) => {
                this.error = error instanceof HttpErrorResponse && error.status === 0
                    ? 'No se ha podido conectar. Comprueba tu conexión y vuelve a intentarlo.'
                    : error instanceof HttpErrorResponse && error.status === 401 ? 'El correo o la contraseña no son correctos.' : 'No pudimos iniciar sesión. Inténtalo de nuevo.';
            }
        });
    }
}
