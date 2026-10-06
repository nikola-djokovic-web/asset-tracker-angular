import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    this.errorMessage.set('');
    this.isLoading.set(true);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/assets']);
      },
      error: (err:any) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Neuspešna prijava. Proverite podatke.');
      }
    });
  }
}