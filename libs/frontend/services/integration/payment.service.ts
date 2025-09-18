import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { gql } from 'apollo-angular';

import { BaseService } from '../core/base.service';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
  QRCodePayment,
  Order,
  ApiResponse
} from '../core/types';

// GraphQL Mutations
const CREATE_PAYMENT = gql`
  mutation CreatePayment($input: CreatePaymentInput!) {
    createPayment(input: $input) {
      id
      orderId
      amount
      currency
      method
      status
      transactionId
      gatewayResponse
      createdAt
    }
  }
`;

const PROCESS_PAYMENT = gql`
  mutation ProcessPayment($paymentId: ID!, $paymentData: PaymentProcessInput!) {
    processPayment(paymentId: $paymentId, paymentData: $paymentData) {
      id
      status
      transactionId
      gatewayResponse
      updatedAt
    }
  }
`;

const REFUND_PAYMENT = gql`
  mutation RefundPayment($paymentId: ID!, $amount: Float, $reason: String) {
    refundPayment(paymentId: $paymentId, amount: $amount, reason: $reason) {
      id
      status
      refundedAmount
      updatedAt
    }
  }
`;

const GENERATE_QR_CODE = gql`
  mutation GenerateQRCode($orderId: ID!, $amount: Float!) {
    generateQRCode(orderId: $orderId, amount: $amount) {
      qrCode
      expiresAt
      amount
      orderId
    }
  }
`;

const VERIFY_QR_PAYMENT = gql`
  query VerifyQRPayment($qrCode: String!) {
    verifyQRPayment(qrCode: $qrCode) {
      id
      orderId
      amount
      status
      expiresAt
      isUsed
    }
  }
`;

export interface CreatePaymentInput {
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  paymentData?: any;
}

export interface PaymentProcessInput {
  cardToken?: string;
  cardDetails?: CardDetails;
  digitalWalletToken?: string;
  bankTransferDetails?: BankTransferDetails;
  cashReceived?: number;
}

export interface CardDetails {
  number: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  holderName: string;
}

export interface BankTransferDetails {
  accountNumber: string;
  routingNumber: string;
  reference: string;
}

export interface PaymentResult {
  success: boolean;
  payment?: Payment;
  error?: string;
  requiresAction?: boolean;
  actionUrl?: string;
}

export interface DigitalWalletConfig {
  applePay: boolean;
  googlePay: boolean;
  payPal: boolean;
  venmo: boolean;
}

/**
 * Payment service handling all payment processing and integration
 * Supports multiple payment methods including cards, digital wallets, QR codes
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentService extends BaseService {
  // State management
  private paymentsSubject = new BehaviorSubject<Payment[]>([]);
  private currentPaymentSubject = new BehaviorSubject<Payment | null>(null);
  private qrPaymentsSubject = new BehaviorSubject<QRCodePayment[]>([]);

  // Observables
  public readonly payments$ = this.paymentsSubject.asObservable();
  public readonly currentPayment$ = this.currentPaymentSubject.asObservable();
  public readonly qrPayments$ = this.qrPaymentsSubject.asObservable();

  // Loading states
  public readonly isProcessingPayment$ = this.getLoading('processPayment');
  public readonly isGeneratingQR$ = this.getLoading('generateQR');
  public readonly isRefunding$ = this.getLoading('refund');

  // Payment gateway configurations
  private digitalWalletConfig: DigitalWalletConfig = {
    applePay: true,
    googlePay: true,
    payPal: true,
    venmo: false
  };

  constructor() {
    super();
  }

  /**
   * Create new payment record
   */
  createPayment(input: CreatePaymentInput): Observable<Payment> {
    return this.mutate<{ createPayment: Payment }>(CREATE_PAYMENT, { input }).pipe(
      map(response => response.createPayment),
      tap(payment => {
        // Update local state
        const currentPayments = this.paymentsSubject.value;
        this.paymentsSubject.next([payment, ...currentPayments]);
        this.currentPaymentSubject.next(payment);
      })
    );
  }

  /**
   * Process payment with different methods
   */
  processPayment(paymentId: string, paymentData: PaymentProcessInput): Observable<PaymentResult> {
    this.setLoading('processPayment', true);

    return this.mutate<{ processPayment: Payment }>(
      PROCESS_PAYMENT,
      { paymentId, paymentData }
    ).pipe(
      map(response => ({
        success: response.processPayment.status === PaymentStatus.COMPLETED,
        payment: response.processPayment
      })),
      tap(result => {
        if (result.payment) {
          this.updatePaymentInState(result.payment);
        }
        this.setLoading('processPayment', false);
      }),
      catchError(error => {
        this.setLoading('processPayment', false);
        return of({
          success: false,
          error: error.message || 'Payment processing failed'
        });
      })
    );
  }

  /**
   * Process card payment
   */
  processCardPayment(
    orderId: string,
    amount: number,
    currency: string,
    cardDetails: CardDetails
  ): Observable<PaymentResult> {
    return this.createPayment({
      orderId,
      amount,
      currency,
      method: PaymentMethod.CARD
    }).pipe(
      switchMap(payment =>
        this.processPayment(payment.id, { cardDetails })
      )
    );
  }

  /**
   * Process cash payment
   */
  processCashPayment(
    orderId: string,
    amount: number,
    currency: string,
    cashReceived: number
  ): Observable<PaymentResult> {
    return this.createPayment({
      orderId,
      amount,
      currency,
      method: PaymentMethod.CASH
    }).pipe(
      switchMap(payment =>
        this.processPayment(payment.id, { cashReceived })
      )
    );
  }

  /**
   * Process digital wallet payment
   */
  processDigitalWalletPayment(
    orderId: string,
    amount: number,
    currency: string,
    walletToken: string
  ): Observable<PaymentResult> {
    return this.createPayment({
      orderId,
      amount,
      currency,
      method: PaymentMethod.DIGITAL_WALLET
    }).pipe(
      switchMap(payment =>
        this.processPayment(payment.id, { digitalWalletToken: walletToken })
      )
    );
  }

  /**
   * Generate QR code for payment
   */
  generateQRCodePayment(orderId: string, amount: number): Observable<QRCodePayment> {
    this.setLoading('generateQR', true);

    return this.mutate<{ generateQRCode: QRCodePayment }>(
      GENERATE_QR_CODE,
      { orderId, amount }
    ).pipe(
      map(response => response.generateQRCode),
      tap(qrPayment => {
        // Update local state
        const currentQRPayments = this.qrPaymentsSubject.value;
        this.qrPaymentsSubject.next([qrPayment, ...currentQRPayments]);
        this.setLoading('generateQR', false);
      }),
      catchError(error => {
        this.setLoading('generateQR', false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verify QR code payment
   */
  verifyQRPayment(qrCode: string): Observable<QRCodePayment> {
    return this.query<{ verifyQRPayment: QRCodePayment }>(
      VERIFY_QR_PAYMENT,
      { qrCode }
    ).pipe(
      map(response => response.verifyQRPayment)
    );
  }

  /**
   * Process QR code payment
   */
  processQRCodePayment(qrCode: string): Observable<PaymentResult> {
    return this.verifyQRPayment(qrCode).pipe(
      switchMap(qrPayment => {
        if (qrPayment.isUsed) {
          return of({
            success: false,
            error: 'QR code has already been used'
          });
        }

        if (new Date() > qrPayment.expiresAt) {
          return of({
            success: false,
            error: 'QR code has expired'
          });
        }

        // Create and process payment
        return this.createPayment({
          orderId: qrPayment.orderId,
          amount: qrPayment.amount,
          currency: 'USD', // Should come from order
          method: PaymentMethod.QR_CODE,
          paymentData: { qrCode }
        }).pipe(
          switchMap(payment =>
            this.processPayment(payment.id, {})
          )
        );
      })
    );
  }

  /**
   * Refund payment
   */
  refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Observable<Payment> {
    this.setLoading('refund', true);

    return this.mutate<{ refundPayment: Payment }>(
      REFUND_PAYMENT,
      { paymentId, amount, reason }
    ).pipe(
      map(response => response.refundPayment),
      tap(refundedPayment => {
        this.updatePaymentInState(refundedPayment);
        this.setLoading('refund', false);
      }),
      catchError(error => {
        this.setLoading('refund', false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if Apple Pay is available
   */
  isApplePayAvailable(): Observable<boolean> {
    if (!this.digitalWalletConfig.applePay) return of(false);

    return new Observable(observer => {
      if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
        ApplePaySession.canMakePaymentsWithActiveCard('merchant.identifier')
          .then(canMakePayments => {
            observer.next(canMakePayments);
            observer.complete();
          })
          .catch(() => {
            observer.next(false);
            observer.complete();
          });
      } else {
        observer.next(false);
        observer.complete();
      }
    });
  }

  /**
   * Check if Google Pay is available
   */
  isGooglePayAvailable(): Observable<boolean> {
    if (!this.digitalWalletConfig.googlePay) return of(false);

    return new Observable(observer => {
      if (window.google && window.google.payments) {
        const paymentsClient = new google.payments.api.PaymentsClient({
          environment: 'TEST' // or 'PRODUCTION'
        });

        paymentsClient.isReadyToPay({
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [{
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['MASTERCARD', 'VISA']
            }
          }]
        }).then(response => {
          observer.next(response.result);
          observer.complete();
        }).catch(() => {
          observer.next(false);
          observer.complete();
        });
      } else {
        observer.next(false);
        observer.complete();
      }
    });
  }

  /**
   * Initiate Apple Pay payment
   */
  initiateApplePayPayment(
    orderId: string,
    amount: number,
    currency: string
  ): Observable<PaymentResult> {
    return new Observable(observer => {
      if (!window.ApplePaySession) {
        observer.next({
          success: false,
          error: 'Apple Pay not available'
        });
        observer.complete();
        return;
      }

      const request = {
        countryCode: 'US',
        currencyCode: currency,
        supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
        merchantCapabilities: ['supports3DS'],
        total: {
          label: 'Restaurant Order',
          amount: amount.toString()
        }
      };

      const session = new ApplePaySession(3, request);

      session.onvalidatemerchant = (event) => {
        // Validate merchant on your server
        // This is a simplified example
        session.completeMerchantValidation({});
      };

      session.onpaymentauthorized = (event) => {
        // Process payment with token
        this.processDigitalWalletPayment(
          orderId,
          amount,
          currency,
          JSON.stringify(event.payment.token)
        ).subscribe({
          next: (result) => {
            if (result.success) {
              session.completePayment(ApplePaySession.STATUS_SUCCESS);
            } else {
              session.completePayment(ApplePaySession.STATUS_FAILURE);
            }
            observer.next(result);
            observer.complete();
          },
          error: (error) => {
            session.completePayment(ApplePaySession.STATUS_FAILURE);
            observer.next({
              success: false,
              error: error.message
            });
            observer.complete();
          }
        });
      };

      session.oncancel = () => {
        observer.next({
          success: false,
          error: 'Payment cancelled by user'
        });
        observer.complete();
      };

      session.begin();
    });
  }

  /**
   * Initiate Google Pay payment
   */
  initiateGooglePayPayment(
    orderId: string,
    amount: number,
    currency: string
  ): Observable<PaymentResult> {
    return new Observable(observer => {
      if (!window.google?.payments) {
        observer.next({
          success: false,
          error: 'Google Pay not available'
        });
        observer.complete();
        return;
      }

      const paymentsClient = new google.payments.api.PaymentsClient({
        environment: 'TEST' // or 'PRODUCTION'
      });

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['MASTERCARD', 'VISA']
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'stripe', // or your gateway
              gatewayMerchantId: 'your-merchant-id'
            }
          }
        }],
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: amount.toString(),
          currencyCode: currency
        },
        merchantInfo: {
          merchantName: 'Restaurant Name'
        }
      };

      paymentsClient.loadPaymentData(paymentDataRequest)
        .then(paymentData => {
          // Process payment with token
          this.processDigitalWalletPayment(
            orderId,
            amount,
            currency,
            JSON.stringify(paymentData.paymentMethodData.tokenizationData.token)
          ).subscribe({
            next: (result) => {
              observer.next(result);
              observer.complete();
            },
            error: (error) => {
              observer.next({
                success: false,
                error: error.message
              });
              observer.complete();
            }
          });
        })
        .catch(error => {
          observer.next({
            success: false,
            error: error.message || 'Google Pay failed'
          });
          observer.complete();
        });
    });
  }

  /**
   * Get payment methods for order
   */
  getAvailablePaymentMethods(): Observable<PaymentMethod[]> {
    return new Observable(observer => {
      const methods: PaymentMethod[] = [PaymentMethod.CASH, PaymentMethod.CARD];

      // Check digital wallet availability
      const checks = [
        this.isApplePayAvailable(),
        this.isGooglePayAvailable()
      ];

      // Add QR code if supported
      methods.push(PaymentMethod.QR_CODE);

      Promise.all(checks.map(check => check.toPromise())).then(results => {
        if (results[0]) methods.push(PaymentMethod.DIGITAL_WALLET); // Apple Pay
        if (results[1]) methods.push(PaymentMethod.DIGITAL_WALLET); // Google Pay

        observer.next(methods);
        observer.complete();
      });
    });
  }

  /**
   * Calculate payment fees
   */
  calculatePaymentFees(amount: number, method: PaymentMethod): number {
    switch (method) {
      case PaymentMethod.CASH:
        return 0;
      case PaymentMethod.CARD:
        return amount * 0.029 + 0.30; // 2.9% + $0.30
      case PaymentMethod.DIGITAL_WALLET:
        return amount * 0.025; // 2.5%
      case PaymentMethod.QR_CODE:
        return amount * 0.015; // 1.5%
      case PaymentMethod.BANK_TRANSFER:
        return 1.00; // Flat fee
      default:
        return 0;
    }
  }

  /**
   * Get payment history for order
   */
  getOrderPayments(orderId: string): Observable<Payment[]> {
    return this.payments$.pipe(
      map(payments => payments.filter(payment => payment.orderId === orderId))
    );
  }

  /**
   * Update payment configuration
   */
  updateDigitalWalletConfig(config: Partial<DigitalWalletConfig>): void {
    this.digitalWalletConfig = { ...this.digitalWalletConfig, ...config };
  }

  /**
   * Get current payment configuration
   */
  getDigitalWalletConfig(): DigitalWalletConfig {
    return { ...this.digitalWalletConfig };
  }

  /**
   * Update payment in local state
   */
  private updatePaymentInState(updatedPayment: Payment): void {
    const currentPayments = this.paymentsSubject.value;
    const updatedPayments = currentPayments.map(payment =>
      payment.id === updatedPayment.id ? updatedPayment : payment
    );
    this.paymentsSubject.next(updatedPayments);

    // Update current payment if it's the same
    const currentPayment = this.currentPaymentSubject.value;
    if (currentPayment && currentPayment.id === updatedPayment.id) {
      this.currentPaymentSubject.next(updatedPayment);
    }
  }

  /**
   * Handle real-time payment updates
   */
  public handlePaymentUpdate(paymentUpdate: {
    paymentId: string;
    status: PaymentStatus;
    transactionId?: string;
  }): void {
    const currentPayments = this.paymentsSubject.value;
    const updatedPayments = currentPayments.map(payment => {
      if (payment.id === paymentUpdate.paymentId) {
        return {
          ...payment,
          status: paymentUpdate.status,
          transactionId: paymentUpdate.transactionId || payment.transactionId,
          updatedAt: new Date()
        };
      }
      return payment;
    });

    this.paymentsSubject.next(updatedPayments);
  }
}