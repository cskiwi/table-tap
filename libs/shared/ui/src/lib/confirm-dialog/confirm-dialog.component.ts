import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

export interface ConfirmDialogConfig {
  message: string
  header?: string
  icon?: string
  acceptLabel?: string
  rejectLabel?: string
  acceptButtonStyleClass?: string
  rejectButtonStyleClass?: string
  acceptVisible?: boolean
  rejectVisible?: boolean
  blockScroll?: boolean
  closable?: boolean
  dismissableMask?: boolean
}

@Component({
  selector: 'tabletap-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.component.html'
})
export class ConfirmDialogComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() blockScroll = true;
  @Input() closable = true;
  @Input() dismissableMask = true;

  constructor(private confirmationService: ConfirmationService) {}

  get dialogStyle(): { [key: string]: string } {
    return {};
  }

  get dialogClass(): string {
    const classes = ['max-w-[90vw]', '[&_.p-dialog-content]:!p-6', '[&_.p-confirm-dialog-message]:!ml-2 [&_.p-confirm-dialog-message]:!leading-relaxed'];

    // Size variants with Tailwind
    if (this.size === 'small') classes.push('!w-[300px]');
    if (this.size === 'medium') classes.push('!w-[400px]');
    if (this.size === 'large') classes.push('!w-[500px]');

    // Responsive
    classes.push('md:!w-auto [&@media(max-width:768px)]:!w-[90vw] [&@media(max-width:768px)]:!m-4');

    return classes.join(' ');
  }

  confirm(config: ConfirmDialogConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmationService.confirm({
        message: config.message,
        header: config.header || 'Confirmation',
        icon: config.icon || 'pi pi-exclamation-triangle',
        acceptLabel: config.acceptLabel || 'Yes',
        rejectLabel: config.rejectLabel || 'No',
        acceptButtonStyleClass: config.acceptButtonStyleClass || 'p-button-primary',
        rejectButtonStyleClass: config.rejectButtonStyleClass || 'p-button-outlined',
        acceptVisible: config.acceptVisible !== false,
        rejectVisible: config.rejectVisible !== false,
        blockScroll: config.blockScroll !== false,
        closable: config.closable !== false,
        dismissableMask: config.dismissableMask !== false,
        accept: () => resolve(true),
        reject: () => resolve(false)
      });
    });
  }

  // Convenience methods for common dialogs
  confirmDelete(itemName?: string): Promise<boolean> {
    return this.confirm({
      message: `Are you sure you want to delete ${itemName || 'this item'}? This action cannot be undone.`,
      header: 'Delete Confirmation',
      icon: 'pi pi-trash',
      acceptLabel: 'Delete',
      acceptButtonStyleClass: 'p-button-danger'
    });
  }

  confirmSave(): Promise<boolean> {
    return this.confirm({
      message: 'Do you want to save your changes?',
      header: 'Save Changes',
      icon: 'pi pi-save',
      acceptLabel: 'Save',
      acceptButtonStyleClass: 'p-button-success'
    });
  }

  confirmDiscard(): Promise<boolean> {
    return this.confirm({
      message: 'You have unsaved changes. Are you sure you want to discard them?',
      header: 'Discard Changes',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Discard',
      acceptButtonStyleClass: 'p-button-warning'
    });
  }

  confirmLogout(): Promise<boolean> {
    return this.confirm({
      message: 'Are you sure you want to log out?',
      header: 'Logout',
      icon: 'pi pi-sign-out',
      acceptLabel: 'Logout',
      acceptButtonStyleClass: 'p-button-secondary'
    });
  }
}