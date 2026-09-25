import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { TokenService } from '../services/token.service';

describe('AuthService', () => {
    let auth: AuthService; let http: HttpTestingController; let tokens: TokenService;
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        auth = TestBed.inject(AuthService); http = TestBed.inject(HttpTestingController); tokens = TestBed.inject(TokenService); tokens.clearTokens();
    });
    afterEach(() => { http.verify(); tokens.clearTokens(); });
    for (const method of ['login', 'register'] as const) {
        it(`stores both tokens after ${method}`, () => {
            auth[method]({ name: 'Ana', email: 'ana@example.com', password: 'secret' }).subscribe();
            http.expectOne(req => req.url.endsWith(`/${method}`)).flush({ token: 'access', refreshToken: 'refresh' });
            expect(tokens.getAccessToken()).toBe('access'); expect(tokens.getRefreshToken()).toBe('refresh');
        });
    }
    it('shares a single refresh between subscribers', () => {
        tokens.setTokens('old', 'refresh');
        const next = jasmine.createSpy('next');
        auth.refresh().subscribe(next); auth.refresh().subscribe(next);
        http.expectOne(req => req.url.endsWith('/refresh')).flush({ token: 'new', refreshToken: 'refresh' });
        expect(next).toHaveBeenCalledTimes(2); expect(tokens.getAccessToken()).toBe('new');
    });
    it('calls logout with the refresh token and clears local state even on failure', () => {
        tokens.setTokens('access', 'refresh');
        auth.logout().subscribe({ error: () => {} });
        const req = http.expectOne(req => req.url.endsWith('/logout'));
        expect(req.request.body).toEqual({ refreshToken: 'refresh' });
        req.flush({}, { status: 500, statusText: 'Error' });
        expect(tokens.isAuthenticated()).toBeFalse();
    });
    it('does not restore tokens from a refresh that completes after logout starts', () => {
        tokens.setTokens('old', 'refresh');
        auth.refresh().subscribe({ error: () => {} });
        auth.logout().subscribe();
        http.expectOne(req => req.url.endsWith('/logout')).flush(null);
        http.expectOne(req => req.url.endsWith('/refresh')).flush({ token: 'new', refreshToken: 'refresh' });
        expect(tokens.isAuthenticated()).toBeFalse();
    });
});
