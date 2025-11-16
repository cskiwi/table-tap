import { InjectionToken } from '@angular/core';

/**
 * Injection token for accessing the Express Request object during SSR.
 * This token is provided in server.ts during server-side rendering.
 * 
 * @example
 * ```typescript
 * constructor(@Optional() @Inject(REQUEST) private request?: any) {
 *   if (request) {
 *     const host = request.headers['host'];
 *   }
 * }
 * ```
 */
export const REQUEST = new InjectionToken<any>('REQUEST');
