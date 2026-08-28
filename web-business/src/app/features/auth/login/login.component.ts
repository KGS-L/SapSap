import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = 'business@sobbra.bf';
  password = 'Password123!';
  isLoading = false;
  errorMessage = '';

  onLogin(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez saisir votre email et mot de passe.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: success => {
        this.isLoading = false;
        if (success) {
          this.router.navigate(['/campaigns']);
        } else {
          this.errorMessage = 'Identifiants invalides. Veuillez réessayer.';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Une erreur est survenue lors de la connexion.';
      }
    });
  }

  loginWithPreset(presetEmail: string): void {
    this.email = presetEmail;
    this.password = 'Password123!';
    this.onLogin();
  }
}
