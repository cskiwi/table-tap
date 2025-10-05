import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'tabletap-empty-state',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.component.html',
  styles: [`
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in-up {
      animation: fadeInUp 0.3s ease-out;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon?: string
  @Input() title?: string
  @Input() subtitle?: string
  @Input() description?: string
  @Input() showAction = false;
  @Input() actionLabel?: string
  @Input() actionIcon?: string
  @Input() actionSeverity: 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast' = 'primary';
  @Input() actionOutlined = false;
  @Input() actionSize: 'small' | 'large' = 'large';
  @Input() actionDisabled = false;
  @Input() actionAriaLabel?: string
  @Input() cssClass?: string
  @Input() ariaLabel?: string
  @Output() actionClick = new EventEmitter<void>()

  get hasCustomIcon(): boolean {
    return !this.icon;
  }

  get hasCustomContent(): boolean {
    return true; // Will be determined by ng-content projection
  }

  get hasMultipleActions(): boolean {
    return true; // Will be determined by ng-content projection
  }

  onActionClick(): void {
    this.actionClick.emit()
  }
}