import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'tabletap-loading-spinner',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loading-spinner.component.html',
})
export class LoadingSpinnerComponent {
  @Input() type: 'spinner' | 'dots' | 'pulse' | 'ring' = 'spinner';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() variant: 'fullscreen' | 'overlay' | 'inline' | 'compact' = 'inline';
  @Input() showText = false;
  @Input() text = 'Loading...';
  @Input() color?: string
  @Input() ariaLabel = 'Loading content';

  // PrimeNG Spinner specific props
  @Input() strokeWidth = '2';
  @Input() fill = 'transparent';
  @Input() animationDuration = '2s';

  get containerClass(): string {
    return `${this.variant} ${this.size}`;
  }

  get spinnerStyle(): { [key: string]: string } {
    const baseStyle: { [key: string]: string } = {};

    if (this.color) {
      baseStyle['color'] = this.color;
    }

    switch (this.size) {
      case 'small':
        baseStyle['width'] = '24px';
        baseStyle['height'] = '24px';
        break;
      case 'large':
        baseStyle['width'] = '60px';
        baseStyle['height'] = '60px';
        break;
      default:
        baseStyle['width'] = '40px';
        baseStyle['height'] = '40px';
    }

    return baseStyle;
  }

  get hasCustomContent(): boolean {
    return true; // Will be determined by ng-content projection
  }
}