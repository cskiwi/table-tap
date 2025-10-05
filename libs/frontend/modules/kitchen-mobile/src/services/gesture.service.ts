import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject, fromEvent, merge } from 'rxjs';
import { map, filter, takeUntil, debounceTime, tap } from 'rxjs/operators';
import {
  SwipeGestureEvent,
  SwipeDirection,
  TouchGestureConfig,
  PinchGestureEvent,
  TapGestureEvent,
  LongPressGestureEvent
} from '../types';

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface GestureState {
  isActive: boolean;
  startPoint: TouchPoint;
  currentPoint: TouchPoint;
  startTime: number;
  element: HTMLElement;
  touches: TouchPoint[];
}

@Injectable({
  providedIn: 'root',
})
export class GestureService {
  private readonly defaultSwipeConfig: TouchGestureConfig = {
    threshold: 50,
    velocity: 0.3,
    direction: [SwipeDirection.LEFT, SwipeDirection.RIGHT, SwipeDirection.UP, SwipeDirection.DOWN],
    preventDefault: true,
    stopPropagation: false
  };

  constructor(private ngZone: NgZone) {}

  // Swipe gesture detection
  onSwipe(element: HTMLElement, config: Partial<TouchGestureConfig> = {}): Observable<SwipeGestureEvent> {
    const finalConfig = { ...this.defaultSwipeConfig, ...config };

    return new Observable(observer => {
      const state: GestureState = {
        isActive: false,
        startPoint: { x: 0, y: 0, timestamp: 0 },
        currentPoint: { x: 0, y: 0, timestamp: 0 },
        startTime: 0,
        element,
        touches: []
      };

      const cleanup$ = new Subject<void>();

      const touchStart = (event: TouchEvent) => {
        if (event.touches.length !== 1) return;

        const touch = event.touches[0];
        state.isActive = true;
        state.startTime = Date.now();
        state.startPoint = {
          x: touch.clientX,
          y: touch.clientY,
          timestamp: state.startTime
        };
        state.currentPoint = { ...state.startPoint };

        if (finalConfig.preventDefault) {
          event.preventDefault();
        }
        if (finalConfig.stopPropagation) {
          event.stopPropagation();
        }
      };

      const touchMove = (event: TouchEvent) => {
        if (!state.isActive || event.touches.length !== 1) return;

        const touch = event.touches[0];
        state.currentPoint = {
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now()
        };

        if (finalConfig.preventDefault) {
          event.preventDefault();
        }
      };

      const touchEnd = (event: TouchEvent) => {
        if (!state.isActive) return;

        const deltaX = state.currentPoint.x - state.startPoint.x;
        const deltaY = state.currentPoint.y - state.startPoint.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const duration = state.currentPoint.timestamp - state.startPoint.timestamp;
        const velocity = duration > 0 ? distance / duration : 0;

        state.isActive = false;

        // Check if gesture meets thresholds
        if (distance >= finalConfig.threshold && velocity >= finalConfig.velocity) {
          const direction = this.getSwipeDirection(deltaX, deltaY);

          if (finalConfig.direction.includes(direction)) {
            this.ngZone.run(() => {
              const gestureEvent: SwipeGestureEvent = {
                direction,
                velocity,
                distance,
                deltaX,
                deltaY,
                target: element
              };
              observer.next(gestureEvent);
            });
          }
        }

        if (finalConfig.preventDefault) {
          event.preventDefault();
        }
      };

      // Add event listeners
      element.addEventListener('touchstart', touchStart, { passive: !finalConfig.preventDefault });
      element.addEventListener('touchmove', touchMove, { passive: !finalConfig.preventDefault });
      element.addEventListener('touchend', touchEnd, { passive: !finalConfig.preventDefault });

      // Cleanup function
      return () => {
        cleanup$.next();
        cleanup$.complete();
        element.removeEventListener('touchstart', touchStart);
        element.removeEventListener('touchmove', touchMove);
        element.removeEventListener('touchend', touchEnd);
      };
    });
  }

  // Pan gesture (continuous movement tracking)
  onPan(element: HTMLElement): Observable<any> {
    return new Observable(observer => {
      const state: GestureState = {
        isActive: false,
        startPoint: { x: 0, y: 0, timestamp: 0 },
        currentPoint: { x: 0, y: 0, timestamp: 0 },
        startTime: 0,
        element,
        touches: []
      };

      const touchStart = (event: TouchEvent) => {
        if (event.touches.length !== 1) return;

        const touch = event.touches[0];
        state.isActive = true;
        state.startTime = Date.now();
        state.startPoint = {
          x: touch.clientX,
          y: touch.clientY,
          timestamp: state.startTime
        };
        state.currentPoint = { ...state.startPoint };

        this.ngZone.run(() => {
          observer.next({
            type: 'panstart',
            deltaX: 0,
            deltaY: 0,
            target: element,
            isFinal: false
          });
        });
      };

      const touchMove = (event: TouchEvent) => {
        if (!state.isActive || event.touches.length !== 1) return;

        const touch = event.touches[0];
        state.currentPoint = {
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now()
        };

        const deltaX = state.currentPoint.x - state.startPoint.x;
        const deltaY = state.currentPoint.y - state.startPoint.y;

        this.ngZone.run(() => {
          observer.next({
            type: 'pan',
            deltaX,
            deltaY,
            target: element,
            isFinal: false
          });
        });

        event.preventDefault();
      };

      const touchEnd = (event: TouchEvent) => {
        if (!state.isActive) return;

        const deltaX = state.currentPoint.x - state.startPoint.x;
        const deltaY = state.currentPoint.y - state.startPoint.y;

        state.isActive = false;

        this.ngZone.run(() => {
          observer.next({
            type: 'panend',
            deltaX,
            deltaY,
            target: element,
            isFinal: true
          });
        });
      };

      element.addEventListener('touchstart', touchStart, { passive: false });
      element.addEventListener('touchmove', touchMove, { passive: false });
      element.addEventListener('touchend', touchEnd, { passive: false });

      return () => {
        element.removeEventListener('touchstart', touchStart);
        element.removeEventListener('touchmove', touchMove);
        element.removeEventListener('touchend', touchEnd);
      };
    });
  }

  // Tap gesture detection
  onTap(element: HTMLElement, options: { tapCount?: number; maxDelay?: number } = {}): Observable<TapGestureEvent> {
    const maxDelay = options.maxDelay || 300;
    const requiredTaps = options.tapCount || 1;

    return new Observable(observer => {
      let tapCount = 0;
      let lastTapTime = 0;
      let tapTimer: any;

      const handleTap = (event: TouchEvent | MouseEvent) => {
        const now = Date.now();
        const touch = 'touches' in event ? event.touches[0] || event.changedTouches[0] : event;

        if (now - lastTapTime > maxDelay) {
          tapCount = 0;
        }

        tapCount++;
        lastTapTime = now;

        if (tapTimer) {
          clearTimeout(tapTimer);
        }

        tapTimer = setTimeout(() => {
          if (tapCount >= requiredTaps) {
            this.ngZone.run(() => {
              const gestureEvent: TapGestureEvent = {
                tapCount,
                center: { x: touch.clientX, y: touch.clientY },
                duration: 0
              };
              observer.next(gestureEvent);
            });
          }
          tapCount = 0;
        }, maxDelay);

        event.preventDefault();
      };

      // Support both touch and mouse events
      element.addEventListener('touchend', handleTap);
      element.addEventListener('click', handleTap);

      return () => {
        if (tapTimer) {
          clearTimeout(tapTimer);
        }
        element.removeEventListener('touchend', handleTap);
        element.removeEventListener('click', handleTap);
      };
    });
  }

  // Long press gesture detection
  onLongPress(element: HTMLElement, options: { duration?: number } = {}): Observable<LongPressGestureEvent> {
    const duration = options.duration || 500;

    return new Observable(observer => {
      let pressTimer: any;
      let startPoint: { x: number; y: number } | null = null;

      const startPress = (event: TouchEvent | MouseEvent) => {
        const touch = 'touches' in event ? event.touches[0] : event;
        startPoint = { x: touch.clientX, y: touch.clientY };

        pressTimer = setTimeout(() => {
          if (startPoint) {
            this.ngZone.run(() => {
              const gestureEvent: LongPressGestureEvent = {
                duration,
                center: startPoint!
              };
              observer.next(gestureEvent);
            });
          }
        }, duration);
      };

      const endPress = () => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
        startPoint = null;
      };

      const cancelPress = (event: TouchEvent | MouseEvent) => {
        if (!startPoint) return;

        const touch = 'touches' in event ? event.touches[0] : event;
        const deltaX = touch.clientX - startPoint.x;
        const deltaY = touch.clientY - startPoint.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Cancel if finger moves too much
        if (distance > 10) {
          endPress();
        }
      };

      element.addEventListener('touchstart', startPress);
      element.addEventListener('mousedown', startPress);
      element.addEventListener('touchend', endPress);
      element.addEventListener('mouseup', endPress);
      element.addEventListener('touchmove', cancelPress);
      element.addEventListener('mousemove', cancelPress);
      element.addEventListener('touchcancel', endPress);

      return () => {
        if (pressTimer) {
          clearTimeout(pressTimer);
        }
        element.removeEventListener('touchstart', startPress);
        element.removeEventListener('mousedown', startPress);
        element.removeEventListener('touchend', endPress);
        element.removeEventListener('mouseup', endPress);
        element.removeEventListener('touchmove', cancelPress);
        element.removeEventListener('mousemove', cancelPress);
        element.removeEventListener('touchcancel', endPress);
      };
    });
  }

  // Pinch gesture detection
  onPinch(element: HTMLElement): Observable<PinchGestureEvent> {
    return new Observable(observer => {
      let initialDistance = 0;
      let initialScale = 1;

      const getDistance = (touches: TouchList): number => {
        const touch1 = touches[0];
        const touch2 = touches[1];
        const deltaX = touch2.clientX - touch1.clientX;
        const deltaY = touch2.clientY - touch1.clientY;
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      };

      const getCenter = (touches: TouchList): { x: number; y: number } => {
        const touch1 = touches[0];
        const touch2 = touches[1];
        return {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2
        };
      };

      const touchStart = (event: TouchEvent) => {
        if (event.touches.length === 2) {
          initialDistance = getDistance(event.touches);
          initialScale = 1;
        }
      };

      const touchMove = (event: TouchEvent) => {
        if (event.touches.length === 2 && initialDistance > 0) {
          const currentDistance = getDistance(event.touches);
          const scale = currentDistance / initialDistance;
          const center = getCenter(event.touches);

          this.ngZone.run(() => {
            const gestureEvent: PinchGestureEvent = {
              scale,
              center,
              rotation: 0 // Could be calculated if needed
            };
            observer.next(gestureEvent);
          });

          event.preventDefault();
        }
      };

      const touchEnd = () => {
        initialDistance = 0;
        initialScale = 1;
      };

      element.addEventListener('touchstart', touchStart);
      element.addEventListener('touchmove', touchMove);
      element.addEventListener('touchend', touchEnd);

      return () => {
        element.removeEventListener('touchstart', touchStart);
        element.removeEventListener('touchmove', touchMove);
        element.removeEventListener('touchend', touchEnd);
      };
    });
  }

  private getSwipeDirection(deltaX: number, deltaY: number): SwipeDirection {
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
    } else {
      return deltaY > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
    }
  }

  // Utility method to disable/enable scrolling during gestures
  disableScrolling(element: HTMLElement = document.body): void {
    element.style.overflow = 'hidden';
    element.style.touchAction = 'none';
  }

  enableScrolling(element: HTMLElement = document.body): void {
    element.style.overflow = '';
    element.style.touchAction = '';
  }

  // Check if device supports touch
  isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  // Get device orientation
  getOrientation(): 'portrait' | 'landscape' {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  // Listen for orientation changes
  onOrientationChange(): Observable<'portrait' | 'landscape'> {
    return fromEvent(window, 'orientationchange').pipe(
      debounceTime(100),
      map(() => this.getOrientation())
    );
  }
}