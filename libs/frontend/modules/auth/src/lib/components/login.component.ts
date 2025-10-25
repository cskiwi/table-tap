import { Component, inject, signal } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { from } from 'rxjs';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    MessageModule,
    DividerModule,
    PasswordModule
],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  isLoading = signal(false);
  errorMessage = signal('');

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      // For demo purposes - in real app, implement custom login
      setTimeout(() => {
        this.isLoading.set(false);
        this.errorMessage.set('Demo mode: Use Auth0 login instead');
      }, 1000);
    }
  }

  loginWithAuth0() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    from(this.auth.loginWithRedirect({
      appState: { target: '/dashboard' }
    })).subscribe({
      next: () => {
        // Redirect handled by Auth0
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('Login failed. Please try again.');
        console.error('Auth0 login error:', error);
      }
    });
  }
}