import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from '../services/token.service';
import { AuthResponse, LoginRequest, RefreshRequest, RegisterRequest } from './models/auth.models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly apiUrl = `${environment.apiUrl}/auth`;

    constructor(
        private http: HttpClient,
        private tokenService: TokenService
    ) { }

    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
            tap(response => this.tokenService.setTokens(response.token, response.refreshToken))
        );
    }

    register(request: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
            tap(response => this.tokenService.setTokens(response.token, response.refreshToken))
        );
    }

    refresh(): Observable<AuthResponse> {
        const refreshToken = this.tokenService.getRefreshToken();
        const request: RefreshRequest = { refreshToken: refreshToken! };

        return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, request).pipe(
            tap(response => this.tokenService.setTokens(response.token, response.refreshToken))
        );
    }

    logout(): Observable<void> {
        const refreshToken = this.tokenService.getRefreshToken();

        return this.http.post<void>(`${this.apiUrl}/logout`, { refreshToken }).pipe(
            tap(() => this.tokenService.clearTokens())
        );
    }

    isAuthenticated(): boolean {
        return this.tokenService.isAuthenticated();
    }
}
