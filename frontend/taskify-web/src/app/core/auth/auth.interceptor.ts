import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const tokenService = inject(TokenService);
    const authService = inject(AuthService);
    const router = inject(Router);

    if (req.url.includes('/auth/')) {
        return next(req);
    }

    const accessToken = tokenService.getAccessToken();

    if (accessToken) {
        req = addToken(req, accessToken);
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && tokenService.getRefreshToken()) {
                return authService.refresh().pipe(
                    switchMap(() => {
                        const newToken = tokenService.getAccessToken();
                        return next(addToken(req, newToken!));
                    }),
                    catchError((refreshError) => {
                        tokenService.clearTokens();
                        router.navigate(['/login']);
                        return throwError(() => refreshError);
                    })
                );
            }
            return throwError(() => error);
        })
    );
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });
}
