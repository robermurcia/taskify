import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { TokenService } from '../services/token.service';
import { routes } from '../../app.routes';

describe('authGuard', () => {
    let tokens: TokenService;
    const run = () => TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
    beforeEach(() => { TestBed.configureTestingModule({ providers: [provideRouter([])] }); tokens = TestBed.inject(TokenService); tokens.clearTokens(); });
    afterEach(() => tokens.clearTokens());
    it('protects the task route and redirects visitors to login', () => {
        expect(routes.find(route => route.path === '')?.canActivate).toContain(authGuard);
        expect(run()).toEqual(TestBed.inject(Router).createUrlTree(['/login']));
    });
    it('allows an existing session, including one recoverable with refresh', () => {
        tokens.setTokens('access', 'refresh'); expect(run()).toBeTrue();
        localStorage.removeItem('accessToken'); expect(run()).toBeTrue();
    });
});
