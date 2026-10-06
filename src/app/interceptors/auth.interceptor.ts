import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { environment } from '../environment';

function readCookie(name: string): string | null {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let authReq = req.clone({
    withCredentials: true, // Ključno za slanje Sanctum sesijskih kolačića i CSRF tokena!
    headers: req.headers.set('Accept', 'application/json')
  });

  // Angular podrazumevano dodaje XSRF header samo za same-origin zahteve.
  // Laravel API je na drugom portu/origin-u, pa ga dodajemo ručno.
  const apiOrigin = new URL(environment.apiUrl).origin;
  const xsrfToken = readCookie('XSRF-TOKEN');
  if (new URL(req.url, document.baseURI).origin === apiOrigin && xsrfToken) {
    authReq = authReq.clone({
      headers: authReq.headers.set('X-XSRF-TOKEN', xsrfToken)
    });
  }

  if (token) {
    authReq = authReq.clone({
      headers: authReq.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq);
};
