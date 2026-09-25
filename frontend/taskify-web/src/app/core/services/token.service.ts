import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TokenService {

    private readonly ACCESS_TOKEN_KEY = 'accessToken';
    private readonly REFRESH_TOKEN_KEY = 'refreshToken';

    getAccessToken(): string | null {
        return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    setTokens(accessToken: string, refreshToken: string): void {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }

    clearTokens(): void {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }

    isAuthenticated(): boolean {
        return !!this.getAccessToken() || !!this.getRefreshToken();
    }

    getUserEmail(): string {
        // Display only: authorization is always verified by the API.
        try {
            const payload = this.getAccessToken()?.split('.')[1];
            if (!payload) return '';
            const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
            const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), c => c.charCodeAt(0));
            const claims: unknown = JSON.parse(new TextDecoder().decode(bytes));
            return typeof claims === 'object' && claims !== null && 'sub' in claims && typeof claims.sub === 'string'
                ? claims.sub : '';
        } catch {
            return '';
        }
    }
}
