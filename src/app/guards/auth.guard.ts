import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser()) {
    return true;
  }

  // Sanctum session login can return 204 and has no bearer token in localStorage.
  // Verify the session with Laravel instead of treating a missing token as logout.
  return authService.fetchCurrentUser().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
