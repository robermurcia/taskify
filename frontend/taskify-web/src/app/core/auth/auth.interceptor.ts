import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from '../services/token.service';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const tokens = inject(TokenService);
    const auth = inject(AuthService);
    const router = inject(Router);
    const api = environment.apiUrl.replace(/\/$/, '');
    if (!req.url.startsWith(`${api}/`) || req.url.startsWith(`${api}/auth/`)) return next(req);

    const token = tokens.getAccessToken();
    const authorized = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
    const endSession = (error: unknown) => {
        tokens.clearTokens();
        void router.navigate(['/login'], { queryParams: { reason: 'expired' } });
        return throwError(() => error);
    };

    return next(authorized).pipe(catchError((error: unknown) => {
        if (!(error instanceof HttpErrorResponse) || error.status !== 401) return throwError(() => error);
        if (!tokens.getRefreshToken()) return endSession(error);
        // Another request may already have renewed this token.
        const latest = tokens.getAccessToken();
        const retry = (accessToken: string) => next(req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })).pipe(
            catchError((retryError: unknown) => retryError instanceof HttpErrorResponse && retryError.status === 401
                ? endSession(retryError) : throwError(() => retryError))
        );
        if (latest && latest !== token) return retry(latest);
        return auth.refresh().pipe(catchError(endSession), switchMap(response => retry(response.token)));
    }));
};
