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
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    MessageModule,
    DividerModule,
    PasswordModule,
    CheckboxModule
],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  isLoading = signal(false);
  errorMessage = signal('');

  registerForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(form: any) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true }
    }

    return null;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      // For demo purposes - in real app, implement custom registration
      setTimeout(() => {
        this.isLoading.set(false);
        this.errorMessage.set('Demo mode: Use Auth0 registration instead');
      }, 1000);
    }
  }

  registerWithAuth0() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    from(this.auth.loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup',
      },
      appState: { target: '/dashboard' }
    })).subscribe({
      next: () => {
        // Redirect handled by Auth0
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('Registration failed. Please try again.');
        console.error('Auth0 registration error:', error);
      }
    });
  }
}