# Data Validation Rules & Schemas

## Overview

This document defines comprehensive data validation rules, schemas, and business logic validation for the Restaurant Ordering System. All validations ensure data integrity, security, and compliance with business requirements.

## 1. Core Data Models & Validation

### 1.1 Customer Data Validation

```typescript
import { z } from 'zod';

// Customer schema
const CustomerSchema = z.object({
  id: z.string().uuid().optional(),
  phone: z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Invalid international phone format')
    .min(8, 'Phone number too short')
    .max(15, 'Phone number too long'),

  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email too long')
    .optional()
    .transform(val => val?.toLowerCase().trim()),

  name: z.string()
    .min(1, 'Name required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Invalid characters in name')
    .optional()
    .transform(val => val?.trim()),

  dateOfBirth: z.date()
    .max(new Date(), 'Birth date cannot be in the future')
    .refine(
      date => new Date().getFullYear() - date.getFullYear() >= 13,
      'Customer must be at least 13 years old'
    )
    .optional(),

  preferences: z.object({
    language: z.enum(['en', 'fr', 'nl', 'de']).default('en'),
    notifications: z.boolean().default(true),
    dietaryRestrictions: z.array(
      z.enum(['vegetarian', 'vegan', 'gluten_free', 'lactose_free', 'halal', 'kosher'])
    ).optional(),
    allergies: z.array(z.string().max(50)).optional()
  }).optional(),

  creditBalance: z.number()
    .nonnegative('Credit balance cannot be negative')
    .max(1000, 'Credit balance limit exceeded')
    .multipleOf(0.01, 'Invalid currency precision'),

  isVip: z.boolean().default(false),

  // Audit fields
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  lastLoginAt: z.date().optional()
});

type Customer = z.infer<typeof CustomerSchema>;
```

### 1.2 Employee Data Validation

```typescript
const EmployeeSchema = z.object({
  id: z.string().uuid().optional(),

  employeeId: z.string()
    .min(3, 'Employee ID too short')
    .max(20, 'Employee ID too long')
    .regex(/^[A-Z0-9\-_]+$/, 'Employee ID format invalid'),

  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email too long')
    .transform(val => val.toLowerCase().trim()),

  name: z.object({
    first: z.string()
      .min(1, 'First name required')
      .max(50, 'First name too long')
      .regex(/^[a-zA-Z\-'\.]+$/, 'Invalid characters in first name'),

    last: z.string()
      .min(1, 'Last name required')
      .max(50, 'Last name too long')
      .regex(/^[a-zA-Z\-'\.]+$/, 'Invalid characters in last name')
  }),

  role: z.enum([
    'employee',
    'barista',
    'cashier',
    'shift_manager',
    'cafe_manager',
    'regional_manager',
    'admin'
  ]),

  cafeId: z.string().uuid('Invalid cafe ID'),

  permissions: z.array(z.string()).optional(),

  contactInfo: z.object({
    phone: z.string()
      .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone format'),
    emergencyContact: z.object({
      name: z.string().min(1).max(100),
      phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
      relationship: z.string().max(50)
    }).optional()
  }),

  employment: z.object({
    startDate: z.date()
      .max(new Date(), 'Start date cannot be in the future'),

    endDate: z.date()
      .min(z.date(), 'End date cannot be in the past')
      .optional(),

    hourlyRate: z.number()
      .positive('Hourly rate must be positive')
      .max(100, 'Hourly rate exceeds maximum')
      .multipleOf(0.01),

    contractType: z.enum(['full_time', 'part_time', 'contract', 'intern']),

    maxWeeklyHours: z.number()
      .int()
      .min(1)
      .max(60, 'Weekly hours exceed legal maximum')
  }),

  // Security
  passwordHash: z.string().min(60), // bcrypt hash length

  nfcBadgeId: z.string()
    .regex(/^[A-F0-9]{8,16}$/, 'Invalid NFC badge format')
    .optional(),

  twoFactorEnabled: z.boolean().default(false),

  // Status
  isActive: z.boolean().default(true),
  lastLoginAt: z.date().optional(),

  // Audit
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

type Employee = z.infer<typeof EmployeeSchema>;
```

### 1.3 Menu Item Validation

```typescript
const MenuItemSchema = z.object({
  id: z.string().uuid().optional(),

  name: z.string()
    .min(1, 'Item name required')
    .max(100, 'Item name too long')
    .trim(),

  description: z.string()
    .max(500, 'Description too long')
    .optional(),

  category: z.string()
    .min(1, 'Category required')
    .max(50, 'Category name too long'),

  tags: z.array(
    z.enum(['hot-drinks', 'cold-drinks', 'food', 'pastry', 'snacks', 'seasonal'])
  ).min(1, 'At least one tag required'),

  pricing: z.object({
    basePrice: z.number()
      .positive('Price must be positive')
      .max(999.99, 'Price exceeds maximum')
      .multipleOf(0.01, 'Invalid price precision'),

    sizes: z.array(z.object({
      name: z.string().min(1).max(20),
      priceModifier: z.number().multipleOf(0.01),
      isDefault: z.boolean().default(false)
    })).optional(),

    currency: z.enum(['EUR']).default('EUR')
  }),

  availability: z.object({
    isAvailable: z.boolean().default(true),

    schedule: z.object({
      availableFrom: z.string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      availableTo: z.string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      daysOfWeek: z.array(z.number().int().min(0).max(6))
    }).optional(),

    maxQuantityPerOrder: z.number()
      .int()
      .positive()
      .max(50)
      .optional(),

    stockLevel: z.number()
      .int()
      .nonnegative()
      .optional()
  }),

  nutritionalInfo: z.object({
    calories: z.number().int().nonnegative().optional(),
    fat: z.number().nonnegative().optional(),
    protein: z.number().nonnegative().optional(),
    carbohydrates: z.number().nonnegative().optional(),
    sugar: z.number().nonnegative().optional(),
    sodium: z.number().nonnegative().optional()
  }).optional(),

  allergens: z.array(
    z.enum([
      'gluten', 'milk', 'eggs', 'nuts', 'peanuts', 'soy',
      'fish', 'shellfish', 'sesame', 'celery', 'mustard', 'lupin'
    ])
  ).optional(),

  customizations: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(50),
    type: z.enum(['size', 'milk_type', 'sweetener', 'extra', 'removal']),
    options: z.array(z.object({
      name: z.string().min(1).max(30),
      priceModifier: z.number().multipleOf(0.01),
      isDefault: z.boolean().default(false)
    })),
    isRequired: z.boolean().default(false),
    maxSelections: z.number().int().positive().optional()
  })).optional(),

  imageUrl: z.string().url().optional(),

  // Audit
  cafeId: z.string().uuid(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdBy: z.string().uuid()
});

type MenuItem = z.infer<typeof MenuItemSchema>;
```

### 1.4 Order Validation

```typescript
const OrderItemSchema = z.object({
  menuItemId: z.string().uuid('Invalid menu item ID'),

  quantity: z.number()
    .int('Quantity must be integer')
    .positive('Quantity must be positive')
    .max(20, 'Quantity exceeds maximum per item'),

  unitPrice: z.number()
    .positive('Unit price must be positive')
    .multipleOf(0.01, 'Invalid price precision'),

  customizations: z.array(z.object({
    customizationId: z.string().uuid(),
    optionId: z.string().uuid(),
    name: z.string().min(1).max(50),
    priceModifier: z.number().multipleOf(0.01)
  })).optional(),

  specialInstructions: z.string()
    .max(200, 'Special instructions too long')
    .optional()
});

const OrderSchema = z.object({
  id: z.string().uuid().optional(),

  orderNumber: z.string()
    .regex(/^ORD-\d{6}$/, 'Invalid order number format')
    .optional(),

  cafeId: z.string().uuid('Invalid cafe ID'),

  customerId: z.string().uuid('Invalid customer ID').optional(),

  items: z.array(OrderItemSchema)
    .min(1, 'Order must contain at least one item')
    .max(50, 'Too many items in order'),

  orderType: z.enum(['dine-in', 'takeaway', 'delivery']),

  tableNumber: z.number()
    .int()
    .positive()
    .max(999)
    .optional()
    .refine((val, ctx) => {
      // Table number required for dine-in orders
      const orderType = ctx.parent.orderType;
      if (orderType === 'dine-in' && !val) {
        return false;
      }
      return true;
    }, 'Table number required for dine-in orders'),

  status: z.enum([
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'completed',
    'cancelled'
  ]).default('pending'),

  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),

  pricing: z.object({
    subtotal: z.number()
      .nonnegative('Subtotal cannot be negative')
      .multipleOf(0.01),

    tax: z.number()
      .nonnegative('Tax cannot be negative')
      .multipleOf(0.01),

    tipAmount: z.number()
      .nonnegative('Tip cannot be negative')
      .multipleOf(0.01)
      .max(100, 'Tip amount excessive')
      .default(0),

    discountAmount: z.number()
      .nonnegative('Discount cannot be negative')
      .multipleOf(0.01)
      .default(0),

    total: z.number()
      .positive('Total must be positive')
      .multipleOf(0.01)
  }).refine(data => {
    // Validate total calculation
    const calculatedTotal = data.subtotal + data.tax + data.tipAmount - data.discountAmount;
    return Math.abs(calculatedTotal - data.total) < 0.005; // Account for rounding
  }, 'Total amount calculation mismatch'),

  specialInstructions: z.string()
    .max(500, 'Special instructions too long')
    .optional(),

  // Timing
  estimatedCompletionTime: z.date()
    .min(new Date(), 'Completion time cannot be in the past')
    .optional(),

  requestedDeliveryTime: z.date()
    .min(new Date(), 'Delivery time cannot be in the past')
    .optional(),

  // Employee attribution
  proxyEmployeeId: z.string().uuid().optional(),

  // Payment
  paymentStatus: z.enum([
    'pending',
    'processing',
    'paid',
    'failed',
    'refunded',
    'partially_refunded'
  ]).default('pending'),

  // Audit
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  completedAt: z.date().optional()
});

// Order business logic validation
const validateOrderBusinessRules = (order: z.infer<typeof OrderSchema>) => {
  const errors: string[] = [];

  // Check if all items are available
  // This would typically check against current menu availability

  // Validate table capacity (dine-in orders)
  if (order.orderType === 'dine-in' && order.tableNumber) {
    // Check table capacity vs number of items/expected customers
  }

  // Validate delivery area (delivery orders)
  if (order.orderType === 'delivery') {
    // Check if delivery address is within service area
    errors.push('Delivery validation not implemented');
  }

  // Check operating hours
  const now = new Date();
  const currentHour = now.getHours();
  if (currentHour < 6 || currentHour > 22) {
    errors.push('Order placed outside operating hours');
  }

  return errors;
};

type Order = z.infer<typeof OrderSchema>;
```

## 2. Payment Data Validation

### 2.1 Payment Method Validation

```typescript
const PaymentMethodSchema = z.discriminatedUnion('type', [
  // Card payment
  z.object({
    type: z.literal('card'),
    card: z.object({
      number: z.string()
        .regex(/^\d{13,19}$/, 'Invalid card number format')
        .refine(luhnCheck, 'Invalid card number'),

      expiryMonth: z.string()
        .regex(/^(0[1-9]|1[0-2])$/, 'Invalid expiry month'),

      expiryYear: z.string()
        .regex(/^20\d{2}$/, 'Invalid expiry year')
        .refine(year => parseInt(year) >= new Date().getFullYear(), 'Card expired'),

      cvv: z.string()
        .regex(/^\d{3,4}$/, 'Invalid CVV format'),

      holderName: z.string()
        .min(2, 'Cardholder name too short')
        .max(50, 'Cardholder name too long')
        .regex(/^[a-zA-Z\s\-'\.]+$/, 'Invalid characters in name')
    }),
    saveCard: z.boolean().default(false)
  }),

  // Saved card token
  z.object({
    type: z.literal('saved_card'),
    token: z.string().min(10).max(100),
    cvv: z.string().regex(/^\d{3,4}$/).optional()
  }),

  // Cash payment
  z.object({
    type: z.literal('cash'),
    amountReceived: z.number()
      .positive('Amount received must be positive')
      .multipleOf(0.01),
    registerId: z.string().uuid()
  }),

  // QR code payment
  z.object({
    type: z.literal('qr'),
    bankTransferRef: z.string().optional()
  }),

  // Credit payment
  z.object({
    type: z.literal('credit'),
    fallbackPayment: z.lazy(() => PaymentMethodSchema).optional()
  })
]);

// Luhn algorithm for card validation
const luhnCheck = (cardNumber: string): boolean => {
  const digits = cardNumber.split('').map(Number);
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};
```

### 2.2 Transaction Validation

```typescript
const TransactionSchema = z.object({
  id: z.string().uuid().optional(),

  orderId: z.string().uuid('Invalid order ID'),

  amount: z.number()
    .positive('Transaction amount must be positive')
    .max(10000, 'Transaction amount exceeds maximum')
    .multipleOf(0.01, 'Invalid currency precision'),

  currency: z.enum(['EUR']).default('EUR'),

  type: z.enum([
    'payment',
    'refund',
    'partial_refund',
    'tip',
    'credit_topup',
    'credit_payment'
  ]),

  method: z.enum(['card', 'cash', 'qr', 'credit']),

  status: z.enum([
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled',
    'expired'
  ]).default('pending'),

  // Gateway information
  gatewayTransactionId: z.string().optional(),
  gatewayResponse: z.record(z.any()).optional(),

  // Processing details
  processedAt: z.date().optional(),
  failureReason: z.string().max(200).optional(),

  // References
  parentTransactionId: z.string().uuid().optional(), // For refunds

  // Metadata
  metadata: z.object({
    cafeId: z.string().uuid(),
    employeeId: z.string().uuid().optional(),
    deviceId: z.string().optional(),
    ipAddress: z.string().ip().optional(),
    userAgent: z.string().max(500).optional()
  }),

  // Audit
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

type Transaction = z.infer<typeof TransactionSchema>;
```

## 3. Time Tracking Validation

### 3.1 Timesheet Entry Validation

```typescript
const TimesheetEntrySchema = z.object({
  id: z.string().uuid().optional(),

  employeeId: z.string().uuid('Invalid employee ID'),

  date: z.date()
    .max(new Date(), 'Date cannot be in the future'),

  clockIn: z.date(),

  clockOut: z.date()
    .optional()
    .refine((clockOut, ctx) => {
      if (clockOut && ctx.parent.clockIn) {
        return clockOut > ctx.parent.clockIn;
      }
      return true;
    }, 'Clock out must be after clock in'),

  breaks: z.array(z.object({
    startTime: z.date(),
    endTime: z.date(),
    type: z.enum(['break', 'meal', 'other']).default('break'),
    duration: z.number().int().positive() // minutes
  })).optional(),

  totalHours: z.number()
    .nonnegative('Total hours cannot be negative')
    .max(24, 'Total hours cannot exceed 24')
    .multipleOf(0.25, 'Hours must be in 15-minute increments')
    .optional(),

  overtime: z.number()
    .nonnegative('Overtime cannot be negative')
    .max(12, 'Overtime exceeds daily maximum')
    .multipleOf(0.25)
    .default(0),

  location: z.object({
    cafeId: z.string().uuid(),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().positive()
    }).optional()
  }),

  status: z.enum(['draft', 'submitted', 'approved', 'rejected']).default('draft'),

  approvedBy: z.string().uuid().optional(),
  approvedAt: z.date().optional(),

  // Audit
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

// Business rule validation for timesheets
const validateTimesheetRules = (entry: z.infer<typeof TimesheetEntrySchema>) => {
  const errors: string[] = [];

  // Maximum daily hours check
  if (entry.totalHours && entry.totalHours > 12) {
    errors.push('Daily hours exceed legal maximum');
  }

  // Minimum break time for long shifts
  if (entry.totalHours && entry.totalHours > 6) {
    const totalBreakTime = entry.breaks?.reduce((sum, b) => sum + b.duration, 0) || 0;
    if (totalBreakTime < 30) {
      errors.push('Minimum 30-minute break required for shifts over 6 hours');
    }
  }

  // No overlapping shifts
  // This would check against other timesheet entries for the same employee

  return errors;
};
```

## 4. Real-time Validation Middleware

### 4.1 Express Validation Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

const validateRequest = (schema: {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate URL parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code
            }))
          }
        });
      }

      next(error);
    }
  };
};

// Usage examples
app.post('/orders',
  validateRequest({
    body: OrderSchema
  }),
  orderController.createOrder
);

app.patch('/employees/:employeeId',
  validateRequest({
    params: z.object({
      employeeId: z.string().uuid()
    }),
    body: EmployeeSchema.partial()
  }),
  employeeController.updateEmployee
);
```

### 4.2 Database Validation Triggers

```sql
-- PostgreSQL trigger for order validation
CREATE OR REPLACE FUNCTION validate_order_constraints()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure table number is unique for active dine-in orders
  IF NEW.order_type = 'dine-in' AND NEW.table_number IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM orders
      WHERE cafe_id = NEW.cafe_id
        AND table_number = NEW.table_number
        AND status NOT IN ('completed', 'cancelled')
        AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Table % is already occupied', NEW.table_number;
    END IF;
  END IF;

  -- Validate total amount calculation
  DECLARE
    calculated_total DECIMAL(10,2);
  BEGIN
    SELECT
      (SELECT SUM(quantity * unit_price) FROM order_items WHERE order_id = NEW.id) +
      COALESCE(NEW.tax, 0) +
      COALESCE(NEW.tip_amount, 0) -
      COALESCE(NEW.discount_amount, 0)
    INTO calculated_total;

    IF ABS(calculated_total - NEW.total) > 0.01 THEN
      RAISE EXCEPTION 'Order total mismatch: expected %, got %', calculated_total, NEW.total;
    END IF;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_validation_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_constraints();
```

## 5. Client-Side Validation

### 5.1 Frontend Form Validation

```typescript
// React hook form with Zod validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const CustomerRegistrationForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<Customer>({
    resolver: zodResolver(CustomerSchema),
    mode: 'onBlur'
  });

  const onSubmit = async (data: Customer) => {
    try {
      await apiClient.post('/customers', data);
    } catch (error) {
      // Handle API validation errors
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('phone')}
        placeholder="Phone number (+32...)"
        aria-invalid={errors.phone ? 'true' : 'false'}
      />
      {errors.phone && (
        <span className="error">{errors.phone.message}</span>
      )}

      <input
        {...register('email')}
        placeholder="Email address"
        aria-invalid={errors.email ? 'true' : 'false'}
      />
      {errors.email && (
        <span className="error">{errors.email.message}</span>
      )}

      <button type="submit">Register</button>
    </form>
  );
};
```

### 5.2 Real-time Field Validation

```typescript
// Custom validation hook for real-time validation
const useRealTimeValidation = <T>(
  schema: ZodSchema<T>,
  dependencies: any[] = []
) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((field: keyof T, value: any) => {
    try {
      const fieldSchema = schema.pick({ [field]: true });
      fieldSchema.parse({ [field]: value });

      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });

      return null;
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldError = error.errors[0]?.message || 'Invalid value';
        setErrors(prev => ({
          ...prev,
          [field as string]: fieldError
        }));
        return fieldError;
      }
      return 'Validation error';
    }
  }, dependencies);

  const validateAll = useCallback((data: T) => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const field = err.path.join('.');
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, dependencies);

  return { errors, validate, validateAll, hasErrors: Object.keys(errors).length > 0 };
};
```

## 6. Custom Validation Rules

### 6.1 Business Logic Validators

```typescript
// Custom validation for Belgian structured communication
const belgianStructuredRefSchema = z.string()
  .regex(/^\+{3}\d{3}\/\d{4}\/\d{5}\+{3}$/, 'Invalid structured communication format')
  .refine(ref => {
    // Validate mod 97 checksum
    const numbers = ref.replace(/\D/g, '');
    const baseNumber = numbers.substring(0, 10);
    const checksum = parseInt(numbers.substring(10, 12));

    const calculatedChecksum = parseInt(baseNumber) % 97;
    const finalChecksum = calculatedChecksum === 0 ? 97 : calculatedChecksum;

    return checksum === finalChecksum;
  }, 'Invalid structured communication checksum');

// Custom validation for operating hours
const operatingHoursSchema = z.object({
  day: z.number().int().min(0).max(6), // 0 = Sunday
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
}).refine(data => {
  const [openHour, openMin] = data.openTime.split(':').map(Number);
  const [closeHour, closeMin] = data.closeTime.split(':').map(Number);

  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  // Handle overnight hours (e.g., 23:00 - 02:00)
  if (closeMinutes < openMinutes) {
    return closeMinutes + 1440 > openMinutes; // Add 24 hours
  }

  return closeMinutes > openMinutes;
}, 'Close time must be after open time');

// Menu item availability validation
const menuAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
  stockLevel: z.number().int().nonnegative().optional(),
  maxDaily: z.number().int().positive().optional()
}).refine(data => {
  if (data.isAvailable && data.stockLevel !== undefined) {
    return data.stockLevel > 0;
  }
  return true;
}, 'Item cannot be available with zero stock');
```

### 6.2 Cross-Field Validation

```typescript
// Order validation with cross-field dependencies
const orderValidationSchema = OrderSchema.refine(data => {
  // Validate that delivery orders have delivery address
  if (data.orderType === 'delivery') {
    return data.deliveryAddress !== undefined;
  }
  return true;
}, 'Delivery address required for delivery orders')
.refine(data => {
  // Validate that tip percentage doesn't exceed 30%
  if (data.tipAmount && data.subtotal) {
    const tipPercentage = (data.tipAmount / data.subtotal) * 100;
    return tipPercentage <= 30;
  }
  return true;
}, 'Tip cannot exceed 30% of order value')
.refine(data => {
  // Validate order timing during business hours
  const orderHour = new Date().getHours();
  if (data.orderType === 'dine-in' && (orderHour < 7 || orderHour > 21)) {
    return false;
  }
  return true;
}, 'Dine-in orders only accepted during business hours');
```

This comprehensive validation system ensures data integrity, security, and business rule compliance across all aspects of the restaurant ordering system while providing clear, actionable error messages to users and developers.