# Animation & Interaction Guidelines - Table Tap Restaurant Ordering System

## Animation Philosophy

**Purposeful • Subtle • Performant • Accessible**

Our animations enhance usability by providing visual feedback, guiding user attention, and creating smooth transitions between states. Every animation serves a functional purpose and can be reduced or disabled for accessibility.

## Core Animation Principles

### 1. Performance First
- **60fps minimum** for all animations
- **GPU acceleration** for transform and opacity changes
- **Avoid animating** layout-triggering properties (width, height, top, left)
- **Use** transform, opacity, filter properties only when possible

### 2. Accessibility Compliance
- **Respect `prefers-reduced-motion`** media query
- **Provide alternatives** for users with vestibular disorders
- **Skip animations** when system accessibility settings indicate preference

### 3. Contextual Timing
- **Fast interactions**: 150ms (button presses, hover states)
- **Standard transitions**: 200-250ms (page transitions, modal opening)
- **Complex animations**: 300-400ms (multi-step processes, loading states)
- **Never exceed** 500ms for any single animation

## Motion Design System

### Easing Functions
```css
:root {
  /* Standard easing curves */
  --ease-in-quad: cubic-bezier(0.55, 0.085, 0.68, 0.53);
  --ease-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-in-out-quad: cubic-bezier(0.455, 0.03, 0.515, 0.955);

  /* Material Design inspired */
  --ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
  --ease-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-accelerate: cubic-bezier(0.4, 0.0, 1, 1);

  /* Custom restaurant app curves */
  --ease-bounce-in: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

### Duration Scale
```css
:root {
  --duration-instant: 0ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-moderate: 250ms;
  --duration-slow: 300ms;
  --duration-slower: 400ms;
}
```

## Component-Specific Animations

### 1. Button Interactions

#### Primary Button States
```css
.btn-primary {
  transition: all var(--duration-fast) var(--ease-standard);
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.3);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(230, 126, 34, 0.2);
  transition-duration: var(--duration-instant);
}

.btn-primary:focus-visible {
  transform: translateY(-1px);
  box-shadow:
    0 4px 12px rgba(230, 126, 34, 0.3),
    0 0 0 3px rgba(230, 126, 34, 0.1);
}
```

#### Loading State Animation
```css
.btn-loading {
  position: relative;
  color: transparent !important;
}

.btn-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin-left: -8px;
  margin-top: -8px;
  border: 2px solid currentColor;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 2. Card Animations

#### Menu Item Card Hover
```css
.menu-item-card {
  transition: all var(--duration-normal) var(--ease-standard);
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.menu-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.menu-item-card:hover .card-image {
  transform: scale(1.02);
}

.card-image {
  transition: transform var(--duration-moderate) var(--ease-standard);
}
```

#### Card Entry Animation
```css
@keyframes cardSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-item-card {
  animation: cardSlideUp var(--duration-normal) var(--ease-out-quad);
}

/* Staggered animation for multiple cards */
.menu-item-card:nth-child(1) { animation-delay: 0ms; }
.menu-item-card:nth-child(2) { animation-delay: 50ms; }
.menu-item-card:nth-child(3) { animation-delay: 100ms; }
.menu-item-card:nth-child(4) { animation-delay: 150ms; }
```

### 3. Modal & Dialog Animations

#### Modal Entrance
```css
.modal-backdrop {
  opacity: 0;
  animation: fadeIn var(--duration-normal) var(--ease-standard) forwards;
}

.modal-content {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
  animation: modalSlideIn var(--duration-moderate) var(--ease-out-quad) forwards;
}

@keyframes fadeIn {
  to { opacity: 1; }
}

@keyframes modalSlideIn {
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

#### Modal Exit
```css
.modal-backdrop.closing {
  animation: fadeOut var(--duration-fast) var(--ease-standard) forwards;
}

.modal-content.closing {
  animation: modalSlideOut var(--duration-fast) var(--ease-in-quad) forwards;
}

@keyframes fadeOut {
  to { opacity: 0; }
}

@keyframes modalSlideOut {
  to {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
}
```

### 4. Navigation Transitions

#### Page Transitions
```css
/* Slide transition for mobile navigation */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutLeft {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}

.page-enter {
  animation: slideInRight var(--duration-moderate) var(--ease-standard);
}

.page-exit {
  animation: slideOutLeft var(--duration-moderate) var(--ease-standard);
}
```

#### Tab Navigation
```css
.tab-button {
  position: relative;
  transition: color var(--duration-fast) var(--ease-standard);
}

.tab-button::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--primary);
  transition: all var(--duration-normal) var(--ease-standard);
  transform: translateX(-50%);
}

.tab-button.active::after {
  width: 100%;
}

.tab-button.active {
  color: var(--primary);
}
```

### 5. Form Interactions

#### Input Focus States
```css
.form-input {
  border: 1px solid #e2e8f0;
  transition: all var(--duration-fast) var(--ease-standard);
  background: white;
}

.form-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.1);
  transform: translateY(-1px);
}

.form-input:focus + .form-label {
  color: var(--primary);
  transform: translateY(-2px);
}

.form-label {
  transition: all var(--duration-fast) var(--ease-standard);
}
```

#### Error State Animation
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.form-input.error {
  border-color: #ef4444;
  animation: shake 0.4s ease-in-out;
}

.error-message {
  opacity: 0;
  transform: translateY(-10px);
  animation: errorSlideIn var(--duration-fast) var(--ease-out-quad) forwards;
}

@keyframes errorSlideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 6. Loading States

#### Skeleton Loading
```css
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.skeleton {
  background: #f1f5f9;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  border-radius: 4px;
}

.skeleton-text {
  height: 1em;
  margin-bottom: 0.5em;
}

.skeleton-text:last-child {
  width: 70%;
}
```

#### Progress Indicators
```css
@keyframes progressFill {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.progress-bar {
  position: relative;
  background: #e2e8f0;
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
  transform-origin: left;
  animation: progressFill var(--duration-slow) var(--ease-out-quad) forwards;
}
```

### 7. Order Status Animations

#### Status Transition
```css
.order-status {
  position: relative;
  overflow: hidden;
}

.order-status::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  to { left: 100%; }
}

.status-complete {
  animation: statusPop var(--duration-normal) var(--ease-bounce-in);
}

@keyframes statusPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

### 8. Toast Notifications

#### Toast Slide In
```css
@keyframes toastSlideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes toastSlideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.toast-enter {
  animation: toastSlideIn var(--duration-moderate) var(--ease-out-quad);
}

.toast-exit {
  animation: toastSlideOut var(--duration-fast) var(--ease-in-quad);
}
```

## Mobile-Specific Animations

### 1. Touch Feedback
```css
.touch-feedback {
  position: relative;
  overflow: hidden;
}

.touch-feedback::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.touch-feedback:active::after {
  width: 200px;
  height: 200px;
}
```

### 2. Pull-to-Refresh
```css
@keyframes pullRefreshSpin {
  to { transform: rotate(360deg); }
}

.pull-refresh-indicator {
  transform: translateY(-100%);
  transition: transform var(--duration-normal) var(--ease-standard);
}

.pull-refresh-indicator.active {
  transform: translateY(0);
}

.pull-refresh-spinner {
  animation: pullRefreshSpin 1s linear infinite;
}
```

### 3. Swipe Gestures
```css
.swipe-action {
  transform: translateX(0);
  transition: transform var(--duration-normal) var(--ease-standard);
}

.swipe-action.swiping {
  transition: none;
}

.swipe-action.swiped-left {
  transform: translateX(-80px);
}

.swipe-action.swiped-right {
  transform: translateX(80px);
}
```

## Accessibility Considerations

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Maintain essential visual feedback */
  .btn:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  .form-input:focus {
    box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.3);
  }
}
```

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  .btn-primary:focus {
    outline: 3px solid;
    outline-offset: 2px;
  }

  .menu-item-card:hover {
    outline: 2px solid;
  }
}
```

## Angular Animations Implementation

### Route Transitions
```typescript
export const slideInAnimation =
  trigger('routeAnimations', [
    transition('* <=> *', [
      style({ position: 'relative' }),
      query(':enter, :leave', [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%'
        })
      ], { optional: true }),
      query(':enter', [
        style({ left: '100%' })
      ], { optional: true }),
      query(':leave', animateChild(), { optional: true }),
      group([
        query(':leave', [
          animate('200ms ease-out', style({ left: '-100%' }))
        ], { optional: true }),
        query(':enter', [
          animate('200ms ease-out', style({ left: '0%' }))
        ], { optional: true })
      ]),
      query(':enter', animateChild(), { optional: true }),
    ])
  ]);
```

### List Animations
```typescript
export const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      stagger(50, [
        animate('200ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ])
    ], { optional: true })
  ])
]);
```

### Component State Animations
```typescript
@Component({
  animations: [
    trigger('cardState', [
      state('idle', style({
        transform: 'translateY(0) scale(1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      })),
      state('hover', style({
        transform: 'translateY(-2px) scale(1.01)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
      })),
      transition('idle <=> hover', [
        animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ])
  ]
})
export class MenuItemCardComponent {
  state = 'idle';

  @HostListener('mouseenter')
  onMouseEnter() {
    this.state = 'hover';
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.state = 'idle';
  }
}
```

## Performance Guidelines

### GPU Acceleration
```css
/* Force GPU acceleration for smooth animations */
.animate-gpu {
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}

/* Remove after animation completes */
.animate-gpu.animation-complete {
  will-change: auto;
}
```

### Animation Monitoring
```typescript
@Injectable()
export class AnimationPerformanceService {
  private frameRate: number = 0;
  private lastTime: number = performance.now();

  monitorFrameRate() {
    const currentTime = performance.now();
    const delta = currentTime - this.lastTime;
    this.frameRate = 1000 / delta;
    this.lastTime = currentTime;

    if (this.frameRate < 55) {
      console.warn('Animation frame rate below optimal:', this.frameRate);
    }

    requestAnimationFrame(() => this.monitorFrameRate());
  }
}
```

These animation guidelines ensure smooth, accessible, and purposeful motion throughout the Table Tap restaurant ordering system while maintaining excellent performance across all devices.