import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, finalize, of, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from '../services/token.service';
import { AuthResponse, LoginRequest, RegisterRequest } from './models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly apiUrl = `${environment.apiUrl}/auth`;
    private refreshRequest$?: Observable<AuthResponse>;
    private sessionVersion = 0;

    constructor(private http: HttpClient, private tokens: TokenService) {}

    login(request: LoginRequest): Observable<AuthResponse> {
        this.sessionVersion++;
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
            tap(response => this.tokens.setTokens(response.token, response.refreshToken))
        );
    }

    register(request: RegisterRequest): Observable<AuthResponse> {
        this.sessionVersion++;
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
            tap(response => this.tokens.setTokens(response.token, response.refreshToken))
        );
    }

    refresh(): Observable<AuthResponse> {
        if (this.refreshRequest$) return this.refreshRequest$;
        const refreshToken = this.tokens.getRefreshToken();
        if (!refreshToken) return throwError(() => new Error('No hay sesión para renovar'));
        const version = this.sessionVersion;
        this.refreshRequest$ = this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
            tap(response => {
                if (version !== this.sessionVersion || this.tokens.getRefreshToken() !== refreshToken) {
                    throw new Error('La sesión ha cambiado');
                }
                this.tokens.setTokens(response.token, response.refreshToken);
            }),
            finalize(() => this.refreshRequest$ = undefined),
            shareReplay({ bufferSize: 1, refCount: true })
        );
        return this.refreshRequest$;
    }

    logout(): Observable<void> {
        this.sessionVersion++;
        const refreshToken = this.tokens.getRefreshToken();
        const request$ = refreshToken
            ? this.http.post<void>(`${this.apiUrl}/logout`, { refreshToken })
            : of(undefined);
        return request$.pipe(finalize(() => this.tokens.clearTokens()));
    }

    isAuthenticated(): boolean {
        return this.tokens.isAuthenticated();
    }
}
