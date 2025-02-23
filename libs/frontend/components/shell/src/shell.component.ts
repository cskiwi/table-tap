import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { AuthService } from '@app/frontend-modules-auth/service';
import { filter, map } from 'rxjs/operators';

import { MessageService } from 'primeng/api';

@Component({
  imports: [CommonModule, RouterOutlet],
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  providers: [MessageService],
})
export class ShellComponent {
  private readonly platformId = inject<string>(PLATFORM_ID);
  private readonly messageService = inject(MessageService);

  auth = inject(AuthService);

  user = this.auth.state.user;

  login() {
    this.auth.state.login({
      appState: {
        target: window.location.pathname,
      },
    });
  }

  logout() {
    this.auth.state.logout();
  }

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const updates = inject(SwUpdate);

      updates.versionUpdates
        .pipe(
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
          map((evt) => ({
            type: 'UPDATE_AVAILABLE',
            current: evt.currentVersion,
            available: evt.latestVersion,
          })),
        )
        .subscribe(() => {
          this.messageService.add({
            severity: 'info',
            summary: 'Update Available',
            detail: 'A new version is available',
            life: 10000,
          });
        });
    }
  }
}
