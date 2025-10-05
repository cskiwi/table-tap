import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

export interface ErrorInfo {
  title?: string
  message: string
  code?: string | number;
  details?: string
  timestamp?: Date
  stack?: string
  type?: 'error' | 'warning' | 'info';
}

@Component({
  selector: 'tabletap-error-display',
  standalone: true,
  imports: [CommonModule, ButtonModule, MessageModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-display.component.html',
  styles: [`
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
  `]
})
export class ErrorDisplayComponent {
  @Input() error?: ErrorInfo
  @Input() message?: string
  @Input() displayMode: 'simple' | 'detailed' | 'card' = 'simple';
  @Input() layout: 'inline' | 'fullwidth' = 'fullwidth';
  @Input() closable = false;
  @Input() showActions = true;
  @Input() showRetry = true;
  @Input() showReport = false;
  @Input() showHome = false;
  @Input() showMeta = true;
  @Input() showStack = false;
  @Input() expandDetails = false;
  @Input() ariaLabel?: string;
  @Output() retry = new EventEmitter<void>();
  @Output() report = new EventEmitter<string | ErrorInfo>();
  @Output() close = new EventEmitter<void>();
  @Output() goHome = new EventEmitter<void>();

  get containerClass(): string {
    return this.layout;
  }

  get messageSeverity(): 'success' | 'info' | 'warn' | 'secondary' | 'contrast' | 'error' {
    if (this.error?.type) {
      switch (this.error.type) {
        case 'warning': return 'warn';
        case 'info': return 'info';
        default: return 'error';
      }
    }
    return 'error';
  }

  get errorIcon(): string {
    const baseClass = 'pi ';
    if (this.error?.type) {
      switch (this.error.type) {
        case 'warning': return baseClass + 'pi-exclamation-triangle warning';
        case 'info': return baseClass + 'pi-info-circle info';
        default: return baseClass + 'pi-times-circle';
      }
    }
    return baseClass + 'pi-times-circle';
  }

  get defaultTitle(): string {
    if (this.error?.type) {
      switch (this.error.type) {
        case 'warning': return 'Warning';
        case 'info': return 'Information';
        default: return 'Error';
      }
    }
    return 'Error';
  }

  get hasCustomContent(): boolean {
    return true; // Will be determined by ng-content projection
  }

  onRetry(): void {
    this.retry.emit()
  }

  onReport(): void {
    this.report.emit(this.error || this.message || 'Unknown error');
  }

  onClose(): void {
    this.close.emit();
  }

  onGoHome(): void {
    this.goHome.emit()
  }
}