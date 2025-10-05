export interface SwipeGestureEvent {
  direction: SwipeDirection;
  velocity: number;
  distance: number;
  deltaX: number;
  deltaY: number;
  target: HTMLElement;
}

export enum SwipeDirection {
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'up',
  DOWN = 'down',
}

export interface TouchGestureConfig {
  threshold: number;
  velocity: number;
  direction: SwipeDirection[]
  preventDefault: boolean;
  stopPropagation: boolean;
}

export interface PinchGestureEvent {
  scale: number;
  center: { x: number; y: number }
  rotation: number;
}

export interface TapGestureEvent {
  tapCount: number;
  center: { x: number; y: number }
  duration: number;
}

export interface LongPressGestureEvent {
  duration: number;
  center: { x: number; y: number }
}