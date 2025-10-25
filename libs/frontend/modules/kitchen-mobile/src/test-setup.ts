// Jest DOM setup for testing
import 'jest-preset-angular/setup-jest';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
}

// Mock MediaDevices for barcode scanner tests
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{
        stop: jest.fn(),
        getSettings: () => ({ deviceId: 'mock-camera' }),
        getCapabilities: () => ({ torch: true, zoom: { min: 1, max: 3 } }),
        applyConstraints: jest.fn().mockResolvedValue(undefined)
      }]
    }),
    enumerateDevices: jest.fn().mockResolvedValue([
      { deviceId: 'camera1', kind: 'videoinput', label: 'Front Camera' },
      { deviceId: 'camera2', kind: 'videoinput', label: 'Back Camera' }
    ])
  }
});

// Mock SpeechRecognition for voice tests
Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    continuous: true,
    interimResults: false,
    lang: 'en-US',
  }))
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: window.SpeechRecognition
});

// Mock SpeechSynthesis for TTS tests
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: jest.fn(),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getVoices: jest.fn().mockReturnValue([
      { name: 'Test Voice', lang: 'en-US', voiceURI: 'test' }
    ])
  }
});

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    close: jest.fn()
  }))
});

Object.defineProperty(Notification, 'permission', {
  writable: true,
  value: 'granted',
});

Object.defineProperty(Notification, 'requestPermission', {
  writable: true,
  value: jest.fn().mockResolvedValue('granted')
});

// Mock IndexedDB for storage tests
const mockIndexedDB = {
  open: jest.fn().mockResolvedValue({
    transaction: jest.fn().mockReturnValue({
      objectStore: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(undefined),
        put: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
        getAll: jest.fn().mockResolvedValue([]),
        createIndex: jest.fn(),
        index: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(undefined),
          getAll: jest.fn().mockResolvedValue([])
        })
      }),
      done: Promise.resolve()
    }),
    createObjectStore: jest.fn().mockReturnValue({
      createIndex: jest.fn()
    })
  })
}

Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: mockIndexedDB
});

// Mock Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: jest.fn().mockResolvedValue({
      addEventListener: jest.fn(),
      pushManager: {
        subscribe: jest.fn().mockResolvedValue({
          endpoint: 'mock-endpoint',
          getKey: jest.fn().mockReturnValue('mock-key')
        }),
        getSubscription: jest.fn().mockResolvedValue(null)
      }
    }),
    ready: Promise.resolve({
      pushManager: {
        subscribe: jest.fn(),
        getSubscription: jest.fn()
      },
      showNotification: jest.fn()
    })
  }
});

// Mock vibration API
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn()
});

// Mock permissions API
Object.defineProperty(navigator, 'permissions', {
  writable: true,
  value: {
    query: jest.fn().mockResolvedValue({
      state: 'granted',
      addEventListener: jest.fn()
    })
  }
});

// Mock storage estimate
Object.defineProperty(navigator, 'storage', {
  writable: true,
  value: {
    estimate: jest.fn().mockResolvedValue({
      usage: 1024 * 1024,
      quota: 1024 * 1024 * 100
    })
  }
});

// Mock touch events
Object.defineProperty(window, 'ontouchstart', {
  writable: true,
  value: null,
});

Object.defineProperty(navigator, 'maxTouchPoints', {
  writable: true,
  value: 5,
});

// Setup global test utilities
global.mockTouchEvent = (type: string, touches: any[] = []) => {
  return new TouchEvent(type, {
    touches: touches as any,
    changedTouches: touches as any,
    targetTouches: touches as any
  });
}

global.mockTouch = (x = 0, y = 0) => ({
  clientX: x,
  clientY: y,
  identifier: Math.random(),
  target: document.body
});

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
}