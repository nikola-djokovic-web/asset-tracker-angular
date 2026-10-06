import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from '../environment';
import { User } from '../models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  
  // Angular Signal za praćenje stanja ulogovanog korisnika
  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  // Učitava CSRF kolačić sa Laravela (obavezno za Sanctum)
  getCsrfCookie(): Observable<any> {
  const sanctumUrl = this.apiUrl.replace('/api', '') + '/sanctum/csrf-cookie';
  return this.http.get(sanctumUrl, { withCredentials: true });
}

login(credentials: { email: string; password: string }): Observable<any> {
  return this.getCsrfCookie().pipe(
    switchMap(() => {
      // Kada se izvrši getCsrfCookie, pregledač je dobio kolačić.
      // Šaljemo post zahtev sa withCredentials: true
      return this.http.post<{ access_token?: string; user?: User }>(
        `${this.apiUrl}/login`, 
        credentials,
        { withCredentials: true }
      );
    }),
    tap(response => {
      if (response.access_token) {
        localStorage.setItem('auth_token', response.access_token);
      }
      if (response.user) {
        this.currentUser.set(response.user);
      }
    })
  );
}

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/user`).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession()
    });
  }

  private clearSession(): void {
    localStorage.removeItem('auth_token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}