/**
 * Frontend Services Index
 * Centralized exports for all service modules
 */

// Core Services
export * from './core/types';
export * from './core/base.service';

// Data Services
export * from './data/order.service';
export * from './data/product.service';

// Real-time Services
export * from './realtime/websocket.service';

// Authentication Services
export * from './auth/auth.service';

// State Management Services
export * from './state/app-state.service';

// Integration Services
export * from './integration/payment.service';

// Utility Services
export * from './utils/error-handler.service';

// Service Configuration
export const SERVICE_CONFIG = {
  version: '1.0.0',
  author: 'Restaurant Ordering System',
  description: 'Comprehensive Angular service architecture for restaurant management'
}

// Service Dependencies
export const SERVICE_DEPENDENCIES = [
  '@angular/core',
  '@angular/common',
  '@angular/common/http',
  '@angular/router',
  '@apollo/client',
  'apollo-angular',
  '@auth0/auth0-angular',
  'socket.io-client',
  'rxjs']

// Service Providers (for app.config.ts)
export const SERVICE_PROVIDERS = [
  // Core services are provided in 'root'
  // Real-time services
  // State management services
  // Integration services
  // Utility services]