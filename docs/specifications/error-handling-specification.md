# Error Handling Strategies & Response Codes

## Overview

This document defines comprehensive error handling strategies, standardized response codes, and recovery mechanisms for the Restaurant Ordering System. The approach ensures consistent error responses, proper error logging, and graceful degradation of services.

## 1. Error Classification & Response Codes

### 1.1 HTTP Status Code Standards

```typescript
enum HttpStatusCode {
  // Success (2xx)
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // Client Errors (4xx)
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  PAYLOAD_TOO_LARGE = 413,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // Server Errors (5xx)
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}
```

### 1.2 Application Error Codes

```typescript
enum ApplicationErrorCode {
  // Authentication & Authorization (1000-1999)
  INVALID_CREDENTIALS = 'ERR_1001',
  TOKEN_EXPIRED = 'ERR_1002',
  TOKEN_INVALID = 'ERR_1003',
  INSUFFICIENT_PERMISSIONS = 'ERR_1004',
  ACCOUNT_LOCKED = 'ERR_1005',
  TWO_FACTOR_REQUIRED = 'ERR_1006',
  DEVICE_NOT_AUTHORIZED = 'ERR_1007',
  SESSION_EXPIRED = 'ERR_1008',

  // Validation (2000-2999)
  VALIDATION_ERROR = 'ERR_2001',
  INVALID_EMAIL_FORMAT = 'ERR_2002',
  INVALID_PHONE_FORMAT = 'ERR_2003',
  INVALID_CARD_NUMBER = 'ERR_2004',
  EXPIRED_CARD = 'ERR_2005',
  INVALID_CVV = 'ERR_2006',
  INVALID_AMOUNT = 'ERR_2007',
  AMOUNT_TOO_LARGE = 'ERR_2008',
  INVALID_CURRENCY = 'ERR_2009',

  // Business Logic (3000-3999)
  ORDER_NOT_FOUND = 'ERR_3001',
  ORDER_ALREADY_PAID = 'ERR_3002',
  ORDER_CANCELLED = 'ERR_3003',
  ORDER_CANNOT_BE_MODIFIED = 'ERR_3004',
  ITEM_NOT_AVAILABLE = 'ERR_3005',
  INSUFFICIENT_STOCK = 'ERR_3006',
  TABLE_OCCUPIED = 'ERR_3007',
  CAFE_CLOSED = 'ERR_3008',
  OUTSIDE_DELIVERY_AREA = 'ERR_3009',
  MINIMUM_ORDER_NOT_MET = 'ERR_3010',
  MAXIMUM_ORDER_EXCEEDED = 'ERR_3011',

  // Payment (4000-4999)
  PAYMENT_FAILED = 'ERR_4001',
  PAYMENT_DECLINED = 'ERR_4002',
  PAYMENT_TIMEOUT = 'ERR_4003',
  INSUFFICIENT_FUNDS = 'ERR_4004',
  PAYMENT_ALREADY_PROCESSED = 'ERR_4005',
  REFUND_FAILED = 'ERR_4006',
  GATEWAY_ERROR = 'ERR_4007',
  INVALID_PAYMENT_METHOD = 'ERR_4008',
  CREDIT_LIMIT_EXCEEDED = 'ERR_4009',
  QR_CODE_EXPIRED = 'ERR_4010',

  // System (5000-5999)
  DATABASE_ERROR = 'ERR_5001',
  EXTERNAL_SERVICE_ERROR = 'ERR_5002',
  TIMEOUT_ERROR = 'ERR_5003',
  RATE_LIMIT_EXCEEDED = 'ERR_5004',
  MAINTENANCE_MODE = 'ERR_5005',
  CONFIGURATION_ERROR = 'ERR_5006',
  NETWORK_ERROR = 'ERR_5007',
  FILE_UPLOAD_ERROR = 'ERR_5008',
  CACHE_ERROR = 'ERR_5009',
  QUEUE_ERROR = 'ERR_5010'
}
```

## 2. Standardized Error Response Format

### 2.1 Base Error Response Structure

```typescript
interface ErrorResponse {
  error: {
    code: ApplicationErrorCode;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
    path: string;
    method: string;

    // User-facing properties
    userMessage?: string;
    userAction?: string;
    retryable: boolean;

    // Debugging information (development only)
    stack?: string;
    query?: Record<string, any>;
    body?: Record<string, any>;

    // Related information
    validation?: ValidationError[];
    suggestions?: string[];
  };
}

interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}
```

### 2.2 Error Response Examples

```typescript
// Validation Error (400)
{
  "error": {
    "code": "ERR_2001",
    "message": "Request validation failed",
    "details": {
      "validationErrors": [
        {
          "field": "email",
          "code": "ERR_2002",
          "message": "Invalid email format",
          "value": "invalid-email"
        },
        {
          "field": "phone",
          "code": "ERR_2003",
          "message": "Phone number must start with country code",
          "value": "123456789"
        }
      ]
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789",
    "path": "/api/v1/customers",
    "method": "POST",
    "userMessage": "Please check your email and phone number format",
    "userAction": "correct_input",
    "retryable": true,
    "suggestions": [
      "Email should be in format: user@example.com",
      "Phone should include country code: +32123456789"
    ]
  }
}

// Business Logic Error (409)
{
  "error": {
    "code": "ERR_3007",
    "message": "Table is already occupied",
    "details": {
      "tableNumber": 15,
      "occupiedSince": "2024-01-15T10:00:00Z",
      "currentOrder": "ORD-123456"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_987654321",
    "path": "/api/v1/orders",
    "method": "POST",
    "userMessage": "Table 15 is currently occupied",
    "userAction": "select_different_table",
    "retryable": true,
    "suggestions": [
      "Try table 12, 14, or 16",
      "Choose takeaway option instead"
    ]
  }
}

// Payment Error (402)
{
  "error": {
    "code": "ERR_4002",
    "message": "Payment was declined by the bank",
    "details": {
      "orderId": "order_uuid",
      "amount": 25.50,
      "paymentMethod": "card",
      "declineReason": "insufficient_funds",
      "bankCode": "51"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_payment_123",
    "path": "/api/v1/payments/card",
    "method": "POST",
    "userMessage": "Your card was declined due to insufficient funds",
    "userAction": "try_different_payment",
    "retryable": true,
    "suggestions": [
      "Try a different card",
      "Use cash payment",
      "Pay with QR code"
    ]
  }
}

// System Error (503)
{
  "error": {
    "code": "ERR_5002",
    "message": "Payment gateway temporarily unavailable",
    "details": {
      "service": "payconic",
      "lastSuccessfulRequest": "2024-01-15T10:25:00Z",
      "estimatedRecovery": "2024-01-15T10:35:00Z"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_system_error",
    "path": "/api/v1/payments/card",
    "method": "POST",
    "userMessage": "Payment system is temporarily unavailable",
    "userAction": "try_later",
    "retryable": true,
    "suggestions": [
      "Try again in 5 minutes",
      "Use cash payment instead",
      "Contact support if the problem persists"
    ]
  }
}
```

## 3. Error Handling Middleware

### 3.1 Express Error Handling Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

interface AppError extends Error {
  statusCode: number;
  code: ApplicationErrorCode;
  isOperational: boolean;
  details?: Record<string, any>;
  userMessage?: string;
  userAction?: string;
  retryable?: boolean;
  suggestions?: string[];
}

class CustomError extends Error implements AppError {
  public statusCode: number;
  public code: ApplicationErrorCode;
  public isOperational: boolean = true;
  public details?: Record<string, any>;
  public userMessage?: string;
  public userAction?: string;
  public retryable?: boolean;
  public suggestions?: string[];

  constructor(
    message: string,
    statusCode: number,
    code: ApplicationErrorCode,
    options: {
      details?: Record<string, any>;
      userMessage?: string;
      userAction?: string;
      retryable?: boolean;
      suggestions?: string[];
    } = {}
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = options.details;
    this.userMessage = options.userMessage;
    this.userAction = options.userAction;
    this.retryable = options.retryable ?? false;
    this.suggestions = options.suggestions;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler
const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate unique request ID if not exists
  const requestId = req.headers['x-request-id'] as string ||
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Log error for monitoring
  console.error({
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.errors.map(error => ({
      field: error.path.join('.'),
      code: 'ERR_2001',
      message: error.message,
      value: error.path.length > 0 ?
        error.path.reduce((obj, key) => obj?.[key], req.body) :
        undefined
    }));

    return res.status(400).json({
      error: {
        code: ApplicationErrorCode.VALIDATION_ERROR,
        message: 'Request validation failed',
        details: { validationErrors },
        timestamp: new Date().toISOString(),
        requestId,
        path: req.path,
        method: req.method,
        userMessage: 'Please check the provided information',
        userAction: 'correct_input',
        retryable: true
      }
    });
  }

  // Handle custom application errors
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString(),
        requestId,
        path: req.path,
        method: req.method,
        userMessage: err.userMessage,
        userAction: err.userAction,
        retryable: err.retryable,
        suggestions: err.suggestions,
        ...(process.env.NODE_ENV === 'development' && {
          stack: err.stack,
          query: req.query,
          body: req.body
        })
      }
    });
  }

  // Handle unexpected errors
  res.status(500).json({
    error: {
      code: ApplicationErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      requestId,
      path: req.path,
      method: req.method,
      userMessage: 'Something went wrong. Please try again later.',
      userAction: 'try_later',
      retryable: true,
      ...(process.env.NODE_ENV === 'development' && {
        originalError: err.message,
        stack: err.stack
      })
    }
  });
};
```

### 3.2 Async Error Wrapper

```typescript
// Wrapper to catch async errors in Express routes
const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Usage in routes
app.post('/orders', asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.createOrder(req.body);
  res.status(201).json(order);
}));
```

## 4. Business Logic Error Handling

### 4.1 Order Management Errors

```typescript
class OrderService {
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      // Validate cafe is open
      const cafe = await this.getCafe(orderData.cafeId);
      if (!this.isCafeOpen(cafe)) {
        throw new CustomError(
          'Cafe is currently closed',
          409,
          ApplicationErrorCode.CAFE_CLOSED,
          {
            userMessage: 'This cafe is currently closed',
            userAction: 'check_hours',
            suggestions: [
              'Check opening hours',
              'Try a different location'
            ],
            details: {
              openingHours: cafe.operatingHours,
              nextOpenTime: this.getNextOpenTime(cafe)
            }
          }
        );
      }

      // Check table availability for dine-in
      if (orderData.orderType === 'dine-in') {
        const isTableAvailable = await this.checkTableAvailability(
          orderData.cafeId,
          orderData.tableNumber
        );

        if (!isTableAvailable) {
          throw new CustomError(
            'Table is already occupied',
            409,
            ApplicationErrorCode.TABLE_OCCUPIED,
            {
              userMessage: `Table ${orderData.tableNumber} is currently occupied`,
              userAction: 'select_different_table',
              retryable: true,
              suggestions: await this.getAvailableTables(orderData.cafeId)
            }
          );
        }
      }

      // Validate item availability
      const unavailableItems = await this.checkItemAvailability(orderData.items);
      if (unavailableItems.length > 0) {
        throw new CustomError(
          'Some items are not available',
          422,
          ApplicationErrorCode.ITEM_NOT_AVAILABLE,
          {
            userMessage: 'Some items in your order are not available',
            userAction: 'remove_items',
            retryable: true,
            details: {
              unavailableItems: unavailableItems.map(item => ({
                id: item.id,
                name: item.name,
                reason: item.unavailableReason
              }))
            },
            suggestions: [
              'Remove unavailable items',
              'Try similar alternatives'
            ]
          }
        );
      }

      return await this.processOrder(orderData);
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof CustomError) {
        throw error;
      }

      // Handle unexpected errors
      throw new CustomError(
        'Failed to create order',
        500,
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        {
          userMessage: 'Unable to process your order right now',
          userAction: 'try_later',
          retryable: true,
          details: { originalError: error.message }
        }
      );
    }
  }
}
```

### 4.2 Payment Error Handling

```typescript
class PaymentService {
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResult> {
    try {
      // Validate payment amount
      if (paymentData.amount <= 0) {
        throw new CustomError(
          'Invalid payment amount',
          400,
          ApplicationErrorCode.INVALID_AMOUNT,
          {
            userMessage: 'Payment amount must be greater than zero',
            userAction: 'check_amount'
          }
        );
      }

      // Process based on payment method
      switch (paymentData.method) {
        case 'card':
          return await this.processCardPayment(paymentData);

        case 'qr':
          return await this.processQRPayment(paymentData);

        case 'cash':
          return await this.processCashPayment(paymentData);

        case 'credit':
          return await this.processCreditPayment(paymentData);

        default:
          throw new CustomError(
            'Unsupported payment method',
            400,
            ApplicationErrorCode.INVALID_PAYMENT_METHOD,
            {
              userMessage: 'This payment method is not supported',
              userAction: 'select_different_method',
              suggestions: ['Card', 'QR Code', 'Cash', 'Store Credit']
            }
          );
      }
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }

      // Handle gateway errors
      if (error.code === 'GATEWAY_TIMEOUT') {
        throw new CustomError(
          'Payment gateway timeout',
          504,
          ApplicationErrorCode.PAYMENT_TIMEOUT,
          {
            userMessage: 'Payment is taking longer than expected',
            userAction: 'wait_or_retry',
            retryable: true,
            suggestions: [
              'Wait a moment and try again',
              'Try a different payment method'
            ]
          }
        );
      }

      throw new CustomError(
        'Payment processing failed',
        500,
        ApplicationErrorCode.PAYMENT_FAILED,
        {
          userMessage: 'Unable to process payment right now',
          userAction: 'try_later',
          retryable: true
        }
      );
    }
  }

  private async processCardPayment(paymentData: PaymentRequest): Promise<PaymentResult> {
    try {
      const result = await payconicGateway.processPayment(paymentData);

      if (!result.success) {
        // Map gateway error codes to application errors
        const errorMapping = {
          'insufficient_funds': {
            code: ApplicationErrorCode.INSUFFICIENT_FUNDS,
            userMessage: 'Insufficient funds on your card',
            suggestions: ['Try a different card', 'Use another payment method']
          },
          'card_declined': {
            code: ApplicationErrorCode.PAYMENT_DECLINED,
            userMessage: 'Your card was declined',
            suggestions: ['Check card details', 'Contact your bank', 'Try another card']
          },
          'expired_card': {
            code: ApplicationErrorCode.EXPIRED_CARD,
            userMessage: 'Your card has expired',
            suggestions: ['Use a different card']
          }
        };

        const errorInfo = errorMapping[result.errorCode] || {
          code: ApplicationErrorCode.PAYMENT_FAILED,
          userMessage: 'Payment failed',
          suggestions: ['Try again', 'Contact support']
        };

        throw new CustomError(
          result.errorMessage,
          402,
          errorInfo.code,
          {
            userMessage: errorInfo.userMessage,
            userAction: 'try_different_payment',
            retryable: true,
            suggestions: errorInfo.suggestions,
            details: {
              gatewayError: result.errorCode,
              transactionId: result.transactionId
            }
          }
        );
      }

      return result;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        'Card payment failed',
        502,
        ApplicationErrorCode.GATEWAY_ERROR,
        {
          userMessage: 'Card payment system is temporarily unavailable',
          userAction: 'try_different_method',
          retryable: true,
          suggestions: ['Try QR code payment', 'Use cash', 'Try again later']
        }
      );
    }
  }
}
```

## 5. WebSocket Error Handling

### 5.1 WebSocket Error Messages

```typescript
interface WebSocketError {
  type: 'error';
  data: {
    code: ApplicationErrorCode;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    connectionId: string;
    retryable: boolean;
    action?: 'reconnect' | 'reauth' | 'ignore';
  };
}

// WebSocket error handler
class WebSocketErrorHandler {
  handleError(ws: WebSocket, error: Error, connectionId: string) {
    let errorResponse: WebSocketError;

    if (error instanceof CustomError) {
      errorResponse = {
        type: 'error',
        data: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: new Date().toISOString(),
          connectionId,
          retryable: error.retryable || false,
          action: this.getRecommendedAction(error.code)
        }
      };
    } else {
      // Handle unexpected WebSocket errors
      errorResponse = {
        type: 'error',
        data: {
          code: ApplicationErrorCode.INTERNAL_SERVER_ERROR,
          message: 'WebSocket connection error',
          timestamp: new Date().toISOString(),
          connectionId,
          retryable: true,
          action: 'reconnect'
        }
      };
    }

    // Send error to client if connection is open
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }

    // Log error for monitoring
    console.error({
      type: 'websocket_error',
      connectionId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  private getRecommendedAction(errorCode: ApplicationErrorCode): string {
    const actionMap = {
      [ApplicationErrorCode.TOKEN_EXPIRED]: 'reauth',
      [ApplicationErrorCode.TOKEN_INVALID]: 'reauth',
      [ApplicationErrorCode.SESSION_EXPIRED]: 'reauth',
      [ApplicationErrorCode.INSUFFICIENT_PERMISSIONS]: 'reauth',
      [ApplicationErrorCode.RATE_LIMIT_EXCEEDED]: 'ignore',
      [ApplicationErrorCode.NETWORK_ERROR]: 'reconnect',
      [ApplicationErrorCode.TIMEOUT_ERROR]: 'reconnect'
    };

    return actionMap[errorCode] || 'reconnect';
  }
}
```

## 6. Client-Side Error Handling

### 6.1 API Client Error Handling

```typescript
class ApiClient {
  private async request<T>(
    url: string,
    options: RequestOptions
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': this.generateRequestId(),
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.error, response.status);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError({
          code: ApplicationErrorCode.NETWORK_ERROR,
          message: 'Network connection failed',
          userMessage: 'Please check your internet connection',
          userAction: 'retry',
          retryable: true
        }, 0);
      }

      // Handle unexpected errors
      throw new ApiError({
        code: ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Unexpected error occurred',
        userMessage: 'Something went wrong. Please try again.',
        userAction: 'retry',
        retryable: true
      }, 500);
    }
  }

  // Automatic retry with exponential backoff
  private async requestWithRetry<T>(
    url: string,
    options: RequestOptions,
    maxRetries: number = 3
  ): Promise<ApiResponse<T>> {
    let lastError: ApiError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<T>(url, options);
      } catch (error) {
        lastError = error as ApiError;

        // Don't retry on client errors (4xx) except timeout and rate limit
        if (lastError.status >= 400 && lastError.status < 500) {
          if (![408, 429].includes(lastError.status)) {
            throw lastError;
          }
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff with jitter
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

class ApiError extends Error {
  constructor(
    public errorData: ErrorResponse['error'],
    public status: number
  ) {
    super(errorData.message);
    this.name = 'ApiError';
  }

  get isRetryable(): boolean {
    return this.errorData.retryable || false;
  }

  get userMessage(): string {
    return this.errorData.userMessage || this.errorData.message;
  }

  get userAction(): string {
    return this.errorData.userAction || 'try_again';
  }

  get suggestions(): string[] {
    return this.errorData.suggestions || [];
  }
}
```

### 6.2 React Error Boundary

```typescript
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Send error to monitoring service
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Oops! Something went wrong</h2>
          <p>We're sorry for the inconvenience. Please refresh the page to try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
const App = () => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      // Log to analytics
      analytics.track('Error Boundary Triggered', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }}
  >
    <Router>
      <Routes>
        {/* App routes */}
      </Routes>
    </Router>
  </ErrorBoundary>
);
```

## 7. Monitoring & Alerting

### 7.1 Error Tracking Integration

```typescript
interface ErrorMetrics {
  errorRate: number;           // Errors per minute
  errorTypes: Record<string, number>;
  affectedUsers: number;
  criticalErrors: number;

  // Performance impact
  averageResponseTime: number;
  timeoutRate: number;

  // Business impact
  failedOrders: number;
  failedPayments: number;
  lostRevenue: number;
}

class ErrorMonitoring {
  private metrics: ErrorMetrics = this.initializeMetrics();

  trackError(error: AppError, context: ErrorContext) {
    // Update metrics
    this.metrics.errorRate++;
    this.metrics.errorTypes[error.code] = (this.metrics.errorTypes[error.code] || 0) + 1;

    // Check if critical error
    if (this.isCriticalError(error)) {
      this.metrics.criticalErrors++;
      this.triggerCriticalAlert(error, context);
    }

    // Send to monitoring service
    this.sendToMonitoring({
      timestamp: new Date().toISOString(),
      error: {
        code: error.code,
        message: error.message,
        stack: error.stack
      },
      context,
      metrics: this.metrics
    });
  }

  private isCriticalError(error: AppError): boolean {
    const criticalCodes = [
      ApplicationErrorCode.DATABASE_ERROR,
      ApplicationErrorCode.PAYMENT_FAILED,
      ApplicationErrorCode.INTERNAL_SERVER_ERROR
    ];

    return criticalCodes.includes(error.code) ||
           error.statusCode >= 500;
  }

  private async triggerCriticalAlert(error: AppError, context: ErrorContext) {
    // Send to Slack/Teams/Email
    await this.sendAlert({
      level: 'critical',
      title: `Critical Error: ${error.code}`,
      message: error.message,
      details: {
        path: context.path,
        method: context.method,
        userId: context.userId,
        requestId: context.requestId
      },
      timestamp: new Date().toISOString()
    });
  }
}
```

This comprehensive error handling specification ensures robust error management, consistent user experience, and effective debugging capabilities throughout the restaurant ordering system.