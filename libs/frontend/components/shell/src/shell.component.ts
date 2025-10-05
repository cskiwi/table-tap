import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID, signal, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { AuthService } from '@app/frontend-modules-auth/service';
import { NavigationService } from '@app/shared-services';
import { filter, map } from 'rxjs/operators';

import { MessageService } from 'primeng/api';

@Component({
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  providers: [MessageService],
})
export class ShellComponent {
  private readonly platformId = inject<string>(PLATFORM_ID);
  private readonly messageService = inject(MessageService);
  private readonly navigationService = inject(NavigationService);

  auth = inject(AuthService);

  user = this.auth.state.user;
  sidebarVisible = signal(false);
  userMenuVisible = signal(false);

  // Reactive navigation data
  readonly visibleNavigation$ = this.navigationService.visibleNavigation$;
  readonly breadcrumbs$ = this.navigationService.breadcrumbs$;

  login() {
    this.auth.state.login({
      appState: {
        target: window.location.pathname,
      },
    });
  }

  logout() {
    this.auth.state.logout()
    this.closeSidebar()
    this.closeUserMenu()
  }

  toggleSidebar() {
    this.sidebarVisible.update(visible => !visible);
  }

  closeSidebar() {
    this.sidebarVisible.set(false);
  }

  toggleUserMenu() {
    this.userMenuVisible.update(visible => !visible);
  }

  closeUserMenu() {
    this.userMenuVisible.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;

    // Close user menu if clicking outside
    if (!target.closest('.user-menu')) {
      this.closeUserMenu()
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    // Close sidebar on desktop resize
    if (window.innerWidth >= 768) {
      this.closeSidebar()
    }
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
