import { Component, inject, signal } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    MessageModule,
    DividerModule
],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');
  emailSent = signal(false);

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      // Simulate API call
      setTimeout(() => {
        this.isLoading.set(false);
        this.emailSent.set(true);

        // In a real app, you would integrate with your auth service
        // For now, just show success message
        console.log('Password reset requested for:', this.forgotPasswordForm.value.email);
      }, 1000);
    }
  }
}