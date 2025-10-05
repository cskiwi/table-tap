import { Component, Input, ChangeDetectionStrategy, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

export interface ToastConfig {
  severity?: 'success' | 'info' | 'warn' | 'error';
  summary?: string
  detail?: string
  life?: number
  sticky?: boolean
  closable?: boolean
  data?: any
  key?: string
  id?: string
  icon?: string
  contentStyleClass?: string
  styleClass?: string
}

@Injectable({ providedIn: 'root' })
export class ToastNotificationService {
  constructor(private messageService: MessageService) {}

  show(config: ToastConfig): void {
    this.messageService.add({
      severity: config.severity || 'info',
      summary: config.summary,
      detail: config.detail,
      life: config.life || 3000,
      sticky: config.sticky || false,
      closable: config.closable !== false,
      data: config.data,
      key: config.key,
      id: config.id,
      icon: config.icon,
      contentStyleClass: config.contentStyleClass,
      styleClass: config.styleClass,
    });
  }

  success(summary: string, detail?: string, life?: number): void {
    this.show({
      severity: 'success',
      summary,
      detail,
      life: life || 3000
    });
  }

  info(summary: string, detail?: string, life?: number): void {
    this.show({
      severity: 'info',
      summary,
      detail,
      life: life || 3000
    });
  }

  warn(summary: string, detail?: string, life?: number): void {
    this.show({
      severity: 'warn',
      summary,
      detail,
      life: life || 5000
    });
  }

  error(summary: string, detail?: string, sticky?: boolean): void {
    this.show({
      severity: 'error',
      summary,
      detail,
      sticky: sticky || false,
      life: sticky ? undefined : 7000
    });
  }

  clear(key?: string): void {
    this.messageService.clear(key);
  }

  clearAll(): void {
    this.messageService.clear()
  }
}

@Component({
  selector: 'tabletap-toast-notification',
  standalone: true,
  imports: [CommonModule, ToastModule],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-notification.component.html',
})
export class ToastNotificationComponent {
  @Input() position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center' = 'top-right';
  @Input() key?: string
  @Input() autoZIndex = true;
  @Input() baseZIndex = 0;
  @Input() preventOpenDuplicates = false;
  @Input() preventDuplicates = false;
  @Input() showTransformOptions = 'translateX(100%)';
  @Input() hideTransformOptions = 'translateX(100%)';
  @Input() showTransitionOptions = '300ms ease-out';
  @Input() hideTransitionOptions = '250ms ease-in';
  @Input() breakpoints?: { [key: string]: string };
  @Input() size: 'default' | 'compact' = 'default';

  get toastClass(): string {
    return this.size;
  }
}