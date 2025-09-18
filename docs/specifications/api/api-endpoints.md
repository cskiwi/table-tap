# API Endpoints and GraphQL Schemas

## Overview
Complete API specification for the payment processing and real-time WebSocket communication system, including REST endpoints, GraphQL schemas, and OpenAPI documentation.

## REST API Endpoints

### Payment Endpoints

#### Initiate Payment
```typescript
/**
 * @api {post} /api/payments/initiate
 * @apiName InitiatePayment
 * @apiGroup Payment
 * @apiVersion 1.0.0
 * @apiDescription Initiate a new payment for an order
 *
 * @apiHeader {String} Authorization Bearer JWT token
 * @apiHeader {String} Content-Type application/json
 *
 * @apiBody {String} orderId Order UUID
 * @apiBody {Number} amount Payment amount in cents
 * @apiBody {Number} [tipAmount] Tip amount in cents
 * @apiBody {String} paymentMethod Payment method enum
 * @apiBody {String} [customerId] Customer UUID
 * @apiBody {String} cafeId Cafe UUID
 * @apiBody {Object} [metadata] Additional payment metadata
 *
 * @apiSuccess {String} paymentId Payment transaction UUID
 * @apiSuccess {String} status Payment status
 * @apiSuccess {String} [redirectUrl] Gateway redirect URL
 * @apiSuccess {String} [qrCodeData] Base64 QR code image
 * @apiSuccess {Date} [expiresAt] Payment expiry time
 */
@Post('initiate')
@UseGuards(JwtAuthGuard)
@ApiTags('payments')
@ApiOperation({ summary: 'Initiate a new payment' })
@ApiResponse({ status: 201, description: 'Payment initiated successfully', type: PaymentResponseDto })
@ApiResponse({ status: 400, description: 'Invalid payment request' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
async initiatePayment(
  @Body() request: InitiatePaymentDto,
  @GetUser() user: UserContext,
  @Req() req: Request
): Promise<PaymentResponseDto> {
  return this.paymentService.initiatePayment({
    ...request,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    initiatedBy: user.id,
  });
}
```

#### Payment Status
```typescript
/**
 * @api {get} /api/payments/:paymentId/status
 * @apiName GetPaymentStatus
 * @apiGroup Payment
 */
@Get(':paymentId/status')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get payment status' })
async getPaymentStatus(
  @Param('paymentId', ParseUUIDPipe) paymentId: string,
  @GetUser() user: UserContext
): Promise<PaymentStatusDto> {
  const payment = await this.paymentService.getPaymentById(paymentId);

  // Authorization check
  if (!this.canAccessPayment(user, payment)) {
    throw new ForbiddenException('Access denied');
  }

  return {
    paymentId: payment.id,
    orderId: payment.orderId,
    status: payment.status,
    amount: payment.totalAmount,
    paymentMethod: payment.paymentMethod,
    createdAt: payment.createdAt,
    completedAt: payment.completedAt,
    expiresAt: payment.expiresAt,
  };
}
```

#### Verify Payment
```typescript
/**
 * @api {post} /api/payments/:paymentId/verify
 * @apiName VerifyPayment
 * @apiGroup Payment
 */
@Post(':paymentId/verify')
@UseGuards(JwtAuthGuard, StaffGuard)
@ApiOperation({ summary: 'Verify payment status with gateway' })
async verifyPayment(
  @Param('paymentId', ParseUUIDPipe) paymentId: string
): Promise<PaymentVerificationDto> {
  return this.paymentService.verifyPayment(paymentId);
}
```

#### Refund Payment
```typescript
/**
 * @api {post} /api/payments/:paymentId/refund
 * @apiName RefundPayment
 * @apiGroup Payment
 */
@Post(':paymentId/refund')
@UseGuards(JwtAuthGuard, ManagerGuard)
@ApiOperation({ summary: 'Process payment refund' })
async refundPayment(
  @Param('paymentId', ParseUUIDPipe) paymentId: string,
  @Body() request: RefundRequestDto,
  @GetUser() user: UserContext
): Promise<RefundResponseDto> {
  return this.paymentService.refundPayment(
    paymentId,
    request.refundAmount,
    request.reason,
    user.id
  );
}
```

### QR Code Endpoints

#### Generate QR Code
```typescript
/**
 * @api {post} /api/qr-payments/generate
 * @apiName GenerateQRCode
 * @apiGroup QRPayment
 */
@Post('generate')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Generate QR code for bank transfer payment' })
async generateQRCode(
  @Body() request: GenerateQRCodeDto
): Promise<QRCodeResponseDto> {
  return this.qrCodeService.generateQRCode(request);
}
```

#### QR Code Status
```typescript
/**
 * @api {get} /api/qr-payments/:qrCodeId/status
 * @apiName GetQRCodeStatus
 * @apiGroup QRPayment
 */
@Get(':qrCodeId/status')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get QR code payment status' })
async getQRCodeStatus(
  @Param('qrCodeId') qrCodeId: string
): Promise<QRCodeStatusDto> {
  return this.qrCodeService.getQRCodeStatus(qrCodeId);
}
```

### Customer Credit Endpoints

#### Get Credit Balance
```typescript
/**
 * @api {get} /api/credits/balance
 * @apiName GetCreditBalance
 * @apiGroup Credits
 */
@Get('balance')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get customer credit balance' })
async getCreditBalance(
  @GetUser() user: UserContext,
  @Query('cafeId') cafeId?: string
): Promise<CreditBalanceDto> {
  return this.creditService.getCreditBalance(user.id, cafeId);
}
```

#### Add Credit
```typescript
/**
 * @api {post} /api/credits/add
 * @apiName AddCredit
 * @apiGroup Credits
 */
@Post('add')
@UseGuards(JwtAuthGuard, StaffGuard)
@ApiOperation({ summary: 'Add credit to customer account' })
async addCredit(
  @Body() request: AddCreditDto,
  @GetUser() user: UserContext
): Promise<CreditTransactionDto> {
  return this.creditService.addCredit(
    request.customerId,
    request.amount,
    request.reason,
    request.metadata,
    request.cafeId,
    user.id
  );
}
```

#### Credit History
```typescript
/**
 * @api {get} /api/credits/history
 * @apiName GetCreditHistory
 * @apiGroup Credits
 */
@Get('history')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get customer credit transaction history' })
async getCreditHistory(
  @GetUser() user: UserContext,
  @Query('cafeId') cafeId?: string,
  @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number
): Promise<CreditHistoryDto> {
  const transactions = await this.creditService.getCreditHistory(
    user.id,
    cafeId,
    limit,
    offset
  );

  return {
    transactions,
    pagination: {
      limit,
      offset,
      hasMore: transactions.length === limit,
    },
  };
}
```

### Webhook Endpoints

#### Payconic Webhook
```typescript
/**
 * @api {post} /api/webhooks/payconic
 * @apiName PayconicWebhook
 * @apiGroup Webhooks
 */
@Post('payconic')
@ApiExcludeEndpoint() // Exclude from public API docs
async handlePayconicWebhook(
  @Body() payload: PayconicWebhookPayload,
  @Headers('payconic-signature') signature: string,
  @Req() request: Request
): Promise<{ status: string }> {
  await this.webhookService.processWebhook(
    payload,
    signature,
    'payconic',
    {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      receivedAt: new Date(),
    }
  );

  return { status: 'processed' };
}
```

## DTOs and Validation

### Payment DTOs
```typescript
import { IsUUID, IsNumber, IsEnum, IsOptional, IsPositive, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class InitiatePaymentDto {
  @ApiProperty({ description: 'Order UUID', format: 'uuid' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ description: 'Payment amount in cents', minimum: 1 })
  @IsNumber()
  @IsPositive()
  @Min(50) // Minimum 50 cents
  @Max(100000000) // Maximum $1M
  amount: number;

  @ApiPropertyOptional({ description: 'Tip amount in cents', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000000) // Maximum $100k tip
  tipAmount?: number;

  @ApiProperty({
    description: 'Payment method',
    enum: ['qr_bank_transfer', 'payconic_card', 'payconic_bank_transfer', 'payconic_digital_wallet', 'cash', 'customer_credit']
  })
  @IsEnum(['qr_bank_transfer', 'payconic_card', 'payconic_bank_transfer', 'payconic_digital_wallet', 'cash', 'customer_credit'])
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Customer UUID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ description: 'Cafe UUID', format: 'uuid' })
  @IsUUID()
  cafeId: string;

  @ApiPropertyOptional({ description: 'Additional payment metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class PaymentResponseDto {
  @ApiProperty({ description: 'Payment transaction UUID' })
  paymentId: string;

  @ApiProperty({ description: 'Payment status' })
  status: string;

  @ApiPropertyOptional({ description: 'Gateway redirect URL' })
  redirectUrl?: string;

  @ApiPropertyOptional({ description: 'Base64 encoded QR code image' })
  qrCodeData?: string;

  @ApiPropertyOptional({ description: 'Payment expiry time' })
  expiresAt?: Date;
}

export class PaymentStatusDto {
  @ApiProperty()
  paymentId: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  paymentMethod: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  expiresAt?: Date;
}
```

### QR Code DTOs
```typescript
export class GenerateQRCodeDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsUUID()
  cafeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ default: 15, minimum: 5, maximum: 60 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(60)
  expiryMinutes?: number = 15;
}

export class QRCodeResponseDto {
  @ApiProperty()
  qrCodeId: string;

  @ApiProperty({ description: 'Base64 encoded QR code image' })
  qrCodeData: string;

  @ApiProperty()
  paymentUrl: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bsb: string;
    reference: string;
  };
}
```

### Credit DTOs
```typescript
export class CreditBalanceDto {
  @ApiProperty()
  balance: number;

  @ApiProperty()
  totalEarned: number;

  @ApiProperty()
  totalSpent: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  expiresAt?: Date;
}

export class AddCreditDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cafeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreditTransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  reason: string;

  @ApiProperty()
  balanceBefore: number;

  @ApiProperty()
  balanceAfter: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  orderId?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;
}
```

## GraphQL Schema

### Payment Types
```graphql
scalar DateTime
scalar UUID
scalar JSON

enum PaymentMethod {
  QR_BANK_TRANSFER
  PAYCONIC_CARD
  PAYCONIC_BANK_TRANSFER
  PAYCONIC_DIGITAL_WALLET
  CASH
  CUSTOMER_CREDIT
  SPLIT_PAYMENT
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
  REFUNDED
  PARTIAL_REFUND
}

type PaymentTransaction {
  id: UUID!
  orderId: UUID!
  customerId: UUID
  cafeId: UUID!
  amount: Float!
  tipAmount: Float
  totalAmount: Float!
  currency: String!
  paymentMethod: PaymentMethod!
  status: PaymentStatus!
  externalTransactionId: String
  gatewayPaymentId: String
  qrCodeReference: String
  staffId: UUID
  tillId: UUID
  metadata: JSON
  initiatedAt: DateTime!
  completedAt: DateTime
  failedAt: DateTime
  expiresAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!

  # Relations
  refunds: [PaymentRefund!]!
  splits: [PaymentSplit!]!
  webhooks: [PaymentWebhook!]!
  order: Order
  customer: Customer
  cafe: Cafe
  staff: Staff
}

type PaymentRefund {
  id: UUID!
  originalTransactionId: UUID!
  refundAmount: Float!
  originalAmount: Float!
  reason: String!
  status: PaymentStatus!
  externalRefundId: String
  staffId: UUID
  cafeId: UUID
  processedAt: DateTime
  createdAt: DateTime!

  # Relations
  originalTransaction: PaymentTransaction!
  staff: Staff
}

type CustomerCredit {
  id: UUID!
  customerId: UUID!
  cafeId: UUID
  balance: Float!
  totalEarned: Float!
  totalSpent: Float!
  currency: String!
  status: String!
  expiresAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!

  # Relations
  transactions: [CreditTransaction!]!
  customer: Customer!
  cafe: Cafe
}

type CreditTransaction {
  id: UUID!
  customerId: UUID!
  customerCreditId: UUID!
  amount: Float!
  type: String!
  reason: String!
  orderId: UUID
  paymentTransactionId: UUID
  staffId: UUID
  cafeId: UUID
  balanceBefore: Float!
  balanceAfter: Float!
  metadata: JSON
  expiresAt: DateTime
  createdAt: DateTime!

  # Relations
  customerCredit: CustomerCredit!
  order: Order
  paymentTransaction: PaymentTransaction
  staff: Staff
}
```

### Input Types
```graphql
input InitiatePaymentInput {
  orderId: UUID!
  amount: Float!
  tipAmount: Float
  paymentMethod: PaymentMethod!
  customerId: UUID
  cafeId: UUID!
  metadata: JSON
}

input RefundPaymentInput {
  paymentId: UUID!
  refundAmount: Float
  reason: String!
}

input AddCreditInput {
  customerId: UUID!
  amount: Float!
  reason: String!
  cafeId: UUID
  metadata: JSON
}

input GenerateQRCodeInput {
  orderId: UUID!
  amount: Float!
  cafeId: UUID!
  customerId: UUID
  expiryMinutes: Int = 15
}
```

### Query Types
```graphql
type Query {
  # Payment queries
  payment(id: UUID!): PaymentTransaction
  payments(
    cafeId: UUID
    customerId: UUID
    status: PaymentStatus
    paymentMethod: PaymentMethod
    startDate: DateTime
    endDate: DateTime
    limit: Int = 50
    offset: Int = 0
  ): [PaymentTransaction!]!

  paymentStatistics(
    cafeId: UUID!
    startDate: DateTime!
    endDate: DateTime!
    groupBy: String = "day"
  ): PaymentStatistics!

  # Credit queries
  creditBalance(customerId: UUID!, cafeId: UUID): CustomerCredit
  creditHistory(
    customerId: UUID!
    cafeId: UUID
    limit: Int = 50
    offset: Int = 0
  ): [CreditTransaction!]!

  # QR Code queries
  qrCodePayment(qrCodeId: String!): QRCodePayment
}

type Mutation {
  # Payment mutations
  initiatePayment(input: InitiatePaymentInput!): PaymentResponse!
  verifyPayment(paymentId: UUID!): PaymentVerificationResult!
  refundPayment(input: RefundPaymentInput!): RefundResult!

  # Credit mutations
  addCredit(input: AddCreditInput!): CreditTransaction!
  deductCredit(input: DeductCreditInput!): CreditTransaction!

  # QR Code mutations
  generateQRCode(input: GenerateQRCodeInput!): QRCodeResponse!
}

type Subscription {
  # Payment subscriptions
  paymentStatusUpdated(paymentId: UUID!): PaymentTransaction!
  paymentsForOrder(orderId: UUID!): PaymentTransaction!
  paymentsForCafe(cafeId: UUID!): PaymentTransaction!

  # Credit subscriptions
  creditBalanceUpdated(customerId: UUID!): CustomerCredit!
}
```

### Response Types
```graphql
type PaymentResponse {
  paymentId: UUID!
  status: PaymentStatus!
  redirectUrl: String
  qrCodeData: String
  expiresAt: DateTime
}

type PaymentVerificationResult {
  paymentId: UUID!
  status: PaymentStatus!
  amount: Float!
  verifiedAt: DateTime!
}

type RefundResult {
  refundId: UUID!
  status: PaymentStatus!
  refundAmount: Float!
  processedAt: DateTime
}

type QRCodeResponse {
  qrCodeId: String!
  qrCodeData: String!
  paymentUrl: String!
  expiresAt: DateTime!
  bankDetails: BankDetails!
}

type BankDetails {
  accountName: String!
  accountNumber: String!
  bsb: String!
  reference: String!
}

type PaymentStatistics {
  totalTransactions: Int!
  totalAmount: Float!
  totalTips: Float!
  averageTransactionAmount: Float!
  paymentMethodBreakdown: [PaymentMethodStats!]!
  statusBreakdown: [PaymentStatusStats!]!
  dailyStats: [DailyPaymentStats!]!
}

type PaymentMethodStats {
  paymentMethod: PaymentMethod!
  count: Int!
  totalAmount: Float!
  percentage: Float!
}

type PaymentStatusStats {
  status: PaymentStatus!
  count: Int!
  percentage: Float!
}

type DailyPaymentStats {
  date: String!
  transactionCount: Int!
  totalAmount: Float!
  averageAmount: Float!
}
```

## OpenAPI Specification

### Security Schemes
```yaml
openapi: 3.0.3
info:
  title: TableTap Payment API
  description: Payment processing and real-time communication API
  version: 1.0.0
  contact:
    name: TableTap Support
    email: support@tabletap.com

servers:
  - url: https://api.tabletap.com/v1
    description: Production server
  - url: https://staging-api.tabletap.com/v1
    description: Staging server

security:
  - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token for authentication

  schemas:
    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: string
          example: "PAYMENT_FAILED"
        message:
          type: string
          example: "Payment processing failed"
        details:
          type: object
          additionalProperties: true
        timestamp:
          type: string
          format: date-time

    PaymentRequest:
      type: object
      required:
        - orderId
        - amount
        - paymentMethod
        - cafeId
      properties:
        orderId:
          type: string
          format: uuid
          description: Order identifier
        amount:
          type: number
          minimum: 0.50
          maximum: 1000000
          description: Payment amount in AUD
        tipAmount:
          type: number
          minimum: 0
          maximum: 100000
          description: Tip amount in AUD
        paymentMethod:
          $ref: '#/components/schemas/PaymentMethod'
        customerId:
          type: string
          format: uuid
          description: Customer identifier
        cafeId:
          type: string
          format: uuid
          description: Cafe identifier
        metadata:
          type: object
          additionalProperties: true

    PaymentMethod:
      type: string
      enum:
        - qr_bank_transfer
        - payconic_card
        - payconic_bank_transfer
        - payconic_digital_wallet
        - cash
        - customer_credit
        - split_payment

    PaymentStatus:
      type: string
      enum:
        - pending
        - processing
        - completed
        - failed
        - cancelled
        - refunded
        - partial_refund

paths:
  /payments/initiate:
    post:
      summary: Initiate Payment
      description: Create a new payment transaction
      operationId: initiatePayment
      tags:
        - Payments
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PaymentRequest'
      responses:
        '201':
          description: Payment initiated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaymentResponse'
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
```

This comprehensive API specification provides a complete foundation for implementing the payment processing and real-time communication system with proper validation, documentation, and type safety.