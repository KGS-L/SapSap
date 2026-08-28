import { Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = 'admin@sapsap.bf';
  password = 'Password123!';
  showPassword = signal<boolean>(false);
  selectedRole = signal<'admin' | 'validator'>('admin');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  selectRole(role: 'admin' | 'validator'): void {
    this.selectedRole.set(role);
    if (role === 'admin') {
      this.fillDemo('admin@sapsap.bf');
    } else {
      this.fillDemo('validator@sapsap.bf');
    }
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage.set('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response: AuthResponse) => {
        this.isLoading.set(false);
        if (response.success) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigateByUrl(returnUrl);
        } else {
          this.errorMessage.set(response.message || 'Échec de connexion.');
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.errorMessage.set(err.error?.message || 'Identifiants invalides (Email ou mot de passe incorrect).');
        } else {
          this.errorMessage.set('Impossible de joindre le serveur API. Connexion locale sécurisée recommandée.');
        }
      }
    });
  }

  fillDemo(email: string): void {
    this.email = email;
    this.password = 'Password123!';
    this.errorMessage.set(null);
  }
}
