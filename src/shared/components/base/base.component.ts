import { Component, OnDestroy, Input, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ComponentConfig, ResponsiveConfig } from '../../interfaces/common.interfaces';

/**
 * Base component class providing common functionality for all components
 */
@Component({
  template: ''
})
export abstract class BaseComponent implements OnInit, OnDestroy {
  @Input() config?: ComponentConfig;
  @Input() responsive: ResponsiveConfig = {
    mobile: true,
    tablet: true,
    desktop: true
  };

  protected destroy$ = new Subject<void>();
  protected isLoading = false;
  protected error: string | null = null;

  // Responsive breakpoints matching Tailwind CSS
  protected readonly breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  };

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize component-specific logic
   * Override in child components
   */
  protected initializeComponent(): void {}

  /**
   * Handle loading state
   */
  protected setLoading(loading: boolean): void {
    this.isLoading = loading;
  }

  /**
   * Handle error state
   */
  protected setError(error: string | null): void {
    this.error = error;
  }

  /**
   * Clear error state
   */
  protected clearError(): void {
    this.error = null;
  }

  /**
   * Get responsive classes based on screen size
   */
  protected getResponsiveClasses(baseClasses: string): string {
    let classes = baseClasses;

    if (this.responsive.mobile) {
      classes += ' sm:block';
    }

    if (this.responsive.tablet) {
      classes += ' md:block';
    }

    if (this.responsive.desktop) {
      classes += ' lg:block';
    }

    return classes;
  }

  /**
   * Get current screen size
   */
  protected getCurrentScreenSize(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;

    if (width < this.breakpoints.md) {
      return 'mobile';
    } else if (width < this.breakpoints.lg) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Check if current screen size matches
   */
  protected isScreenSize(size: 'mobile' | 'tablet' | 'desktop'): boolean {
    return this.getCurrentScreenSize() === size;
  }

  /**
   * Get accessibility attributes
   */
  protected getA11yAttributes(): { [key: string]: string } {
    const attrs: { [key: string]: string } = {};

    if (this.config?.accessibility?.ariaLabels) {
      attrs['aria-label'] = this.getAriaLabel();
    }

    if (this.config?.accessibility?.keyboardNavigation) {
      attrs['tabindex'] = '0';
    }

    return attrs;
  }

  /**
   * Get ARIA label for component
   * Override in child components
   */
  protected getAriaLabel(): string {
    return '';
  }

  /**
   * Handle keyboard events
   * Override in child components
   */
  protected onKeyDown(event: KeyboardEvent): void {}

  /**
   * Unsubscribe helper
   */
  protected unsubscribeOnDestroy() {
    return takeUntil(this.destroy$);
  }
}