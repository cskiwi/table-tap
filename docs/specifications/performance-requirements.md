# Performance Requirements & SLA Metrics

## Overview

This document defines comprehensive performance requirements, Service Level Agreements (SLAs), monitoring metrics, and optimization strategies for the Restaurant Ordering System. The specifications ensure optimal user experience across all system components under varying load conditions.

## 1. Performance Requirements by Component

### 1.1 API Performance Requirements

```typescript
interface ApiPerformanceRequirements {
  responseTime: {
    p50: number;    // 50th percentile
    p95: number;    // 95th percentile
    p99: number;    // 99th percentile
    max: number;    // Maximum acceptable response time
  };
  throughput: {
    requestsPerSecond: number;
    concurrentUsers: number;
  };
  availability: {
    uptime: number;           // Percentage
    downtimeMinutesPerMonth: number;
  };
  errorRate: {
    maxErrorRate: number;     // Percentage
    criticalErrorRate: number;
  };
}

const apiPerformanceTargets: Record<string, ApiPerformanceRequirements> = {
  // Customer-facing APIs
  'customer-orders': {
    responseTime: {
      p50: 150,     // 150ms
      p95: 300,     // 300ms
      p99: 500,     // 500ms
      max: 1000     // 1s
    },
    throughput: {
      requestsPerSecond: 500,
      concurrentUsers: 2000
    },
    availability: {
      uptime: 99.9,
      downtimeMinutesPerMonth: 43.8
    },
    errorRate: {
      maxErrorRate: 0.1,
      criticalErrorRate: 0.01
    }
  },

  // Payment processing
  'payments': {
    responseTime: {
      p50: 200,     // 200ms
      p95: 500,     // 500ms
      p99: 1000,    // 1s
      max: 3000     // 3s
    },
    throughput: {
      requestsPerSecond: 200,
      concurrentUsers: 1000
    },
    availability: {
      uptime: 99.95,
      downtimeMinutesPerMonth: 22
    },
    errorRate: {
      maxErrorRate: 0.05,
      criticalErrorRate: 0.005
    }
  },

  // Menu and catalog
  'menu': {
    responseTime: {
      p50: 100,     // 100ms
      p95: 200,     // 200ms
      p99: 400,     // 400ms
      max: 800      // 800ms
    },
    throughput: {
      requestsPerSecond: 1000,
      concurrentUsers: 5000
    },
    availability: {
      uptime: 99.9,
      downtimeMinutesPerMonth: 43.8
    },
    errorRate: {
      maxErrorRate: 0.1,
      criticalErrorRate: 0.01
    }
  },

  // Staff operations
  'staff-operations': {
    responseTime: {
      p50: 200,     // 200ms
      p95: 400,     // 400ms
      p99: 800,     // 800ms
      max: 1500     // 1.5s
    },
    throughput: {
      requestsPerSecond: 300,
      concurrentUsers: 500
    },
    availability: {
      uptime: 99.5,
      downtimeMinutesPerMonth: 219
    },
    errorRate: {
      maxErrorRate: 0.2,
      criticalErrorRate: 0.02
    }
  }
};
```

### 1.2 WebSocket Performance Requirements

```typescript
interface WebSocketPerformanceRequirements {
  connectionSetup: {
    maxSetupTime: number;     // Milliseconds
    successRate: number;      // Percentage
  };
  messageDelivery: {
    latency: {
      local: number;          // Same data center
      regional: number;       // Same region
      global: number;         // Cross-region
    };
    throughput: {
      messagesPerSecond: number;
      maxConcurrentConnections: number;
    };
  };
  reliability: {
    connectionUptime: number; // Percentage
    messageDeliveryRate: number; // Percentage
    reconnectionTime: number; // Milliseconds
  };
}

const websocketTargets: WebSocketPerformanceRequirements = {
  connectionSetup: {
    maxSetupTime: 1000,      // 1 second
    successRate: 99.5        // 99.5%
  },
  messageDelivery: {
    latency: {
      local: 10,             // 10ms
      regional: 50,          // 50ms
      global: 150            // 150ms
    },
    throughput: {
      messagesPerSecond: 10000,
      maxConcurrentConnections: 10000
    }
  },
  reliability: {
    connectionUptime: 99.9,
    messageDeliveryRate: 99.99,
    reconnectionTime: 2000   // 2 seconds
  }
};
```

### 1.3 Database Performance Requirements

```typescript
interface DatabasePerformanceRequirements {
  queries: {
    simple: {           // SELECT with primary key
      p95: number;
      p99: number;
    };
    complex: {          // JOINs, aggregations
      p95: number;
      p99: number;
    };
    writes: {           // INSERT, UPDATE, DELETE
      p95: number;
      p99: number;
    };
  };
  transactions: {
    throughput: number; // Transactions per second
    isolation: string;  // Isolation level
  };
  connections: {
    maxConnections: number;
    poolSize: number;
    idleTimeout: number;
  };
  storage: {
    maxDatabaseSize: string;
    backupTime: number;  // Maximum backup duration
  };
}

const databaseTargets: DatabasePerformanceRequirements = {
  queries: {
    simple: {
      p95: 5,          // 5ms
      p99: 10          // 10ms
    },
    complex: {
      p95: 50,         // 50ms
      p99: 100         // 100ms
    },
    writes: {
      p95: 20,         // 20ms
      p99: 40          // 40ms
    }
  },
  transactions: {
    throughput: 1000,    // 1000 TPS
    isolation: 'READ_COMMITTED'
  },
  connections: {
    maxConnections: 200,
    poolSize: 20,
    idleTimeout: 30000   // 30 seconds
  },
  storage: {
    maxDatabaseSize: '1TB',
    backupTime: 3600     // 1 hour
  }
};
```

## 2. Service Level Agreements (SLAs)

### 2.1 Customer-Facing SLAs

```typescript
interface CustomerSLA {
  service: string;
  availability: {
    monthly: number;        // Uptime percentage
    dailyDowntime: number;  // Maximum minutes per day
    maintenanceWindow: {
      duration: number;     // Minutes per week
      schedule: string;     // Time window
    };
  };
  performance: {
    responseTime: number;   // 95th percentile in ms
    orderProcessingTime: number; // End-to-end order time
    paymentProcessingTime: number;
  };
  support: {
    responseTime: {
      critical: number;     // Minutes for P1 issues
      high: number;         // Minutes for P2 issues
      medium: number;       // Hours for P3 issues
      low: number;          // Hours for P4 issues
    };
  };
  dataProtection: {
    backupFrequency: number;    // Hours
    recoveryTimeObjective: number; // RTO in hours
    recoveryPointObjective: number; // RPO in hours
  };
}

const customerSLAs: CustomerSLA[] = [
  {
    service: 'Order Placement & Management',
    availability: {
      monthly: 99.9,        // 43.8 minutes downtime/month
      dailyDowntime: 1.44,  // 1.44 minutes per day
      maintenanceWindow: {
        duration: 120,      // 2 hours per week
        schedule: 'Sunday 02:00-04:00 CET'
      }
    },
    performance: {
      responseTime: 300,          // 300ms
      orderProcessingTime: 30000, // 30 seconds
      paymentProcessingTime: 5000 // 5 seconds
    },
    support: {
      responseTime: {
        critical: 15,       // 15 minutes
        high: 60,          // 1 hour
        medium: 4,         // 4 hours
        low: 24            // 24 hours
      }
    },
    dataProtection: {
      backupFrequency: 6,        // Every 6 hours
      recoveryTimeObjective: 4,   // 4 hours
      recoveryPointObjective: 1   // 1 hour
    }
  },

  {
    service: 'Payment Processing',
    availability: {
      monthly: 99.95,       // 22 minutes downtime/month
      dailyDowntime: 0.72,  // 0.72 minutes per day
      maintenanceWindow: {
        duration: 60,       // 1 hour per week
        schedule: 'Sunday 03:00-04:00 CET'
      }
    },
    performance: {
      responseTime: 500,          // 500ms
      orderProcessingTime: 10000, // 10 seconds
      paymentProcessingTime: 3000 // 3 seconds
    },
    support: {
      responseTime: {
        critical: 10,       // 10 minutes
        high: 30,          // 30 minutes
        medium: 2,         // 2 hours
        low: 12            // 12 hours
      }
    },
    dataProtection: {
      backupFrequency: 1,         // Every hour
      recoveryTimeObjective: 2,   // 2 hours
      recoveryPointObjective: 0.5 // 30 minutes
    }
  }
];
```

### 2.2 Business Impact Metrics

```typescript
interface BusinessImpactMetrics {
  revenueImpact: {
    costPerMinuteDowntime: number;  // EUR per minute
    orderConversionRate: number;    // Target conversion rate
    averageOrderValue: number;      // EUR
  };
  customerExperience: {
    maxAcceptableWaitTime: number;  // Seconds
    abandonmentRateThreshold: number; // Percentage
    customerSatisfactionTarget: number; // Score out of 5
  };
  operationalEfficiency: {
    staffProductivityTarget: number;     // Orders per hour per employee
    kitchenThroughputTarget: number;    // Orders per hour
    peakHourCapacityUtilization: number; // Percentage
  };
}

const businessTargets: BusinessImpactMetrics = {
  revenueImpact: {
    costPerMinuteDowntime: 500,    // €500/minute during peak
    orderConversionRate: 85,       // 85% of cart abandonment recovery
    averageOrderValue: 15.50       // €15.50
  },
  customerExperience: {
    maxAcceptableWaitTime: 600,    // 10 minutes
    abandonmentRateThreshold: 15,  // 15%
    customerSatisfactionTarget: 4.2 // 4.2/5 stars
  },
  operationalEfficiency: {
    staffProductivityTarget: 30,    // 30 orders/hour per employee
    kitchenThroughputTarget: 60,   // 60 orders/hour per counter
    peakHourCapacityUtilization: 85 // 85%
  }
};
```

## 3. Load Testing Specifications

### 3.1 Load Testing Scenarios

```typescript
interface LoadTestScenario {
  name: string;
  description: string;
  duration: number;        // Test duration in seconds
  users: {
    initial: number;
    rampUp: number;        // Users added per second
    peak: number;          // Maximum concurrent users
    rampDown: number;      // Users removed per second
  };
  operations: LoadTestOperation[];
  acceptanceCriteria: {
    responseTime: number;  // 95th percentile
    errorRate: number;     // Maximum error rate
    throughput: number;    // Minimum requests per second
  };
}

interface LoadTestOperation {
  name: string;
  weight: number;          // Percentage of total operations
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  thinkTime: number;      // Delay between operations (ms)
}

const loadTestScenarios: LoadTestScenario[] = [
  {
    name: 'Peak Hour Simulation',
    description: 'Simulate lunch rush hour traffic',
    duration: 1800,        // 30 minutes
    users: {
      initial: 10,
      rampUp: 5,           // 5 users/second
      peak: 1000,
      rampDown: 2
    },
    operations: [
      {
        name: 'Browse Menu',
        weight: 40,
        endpoint: '/api/v1/cafes/{cafeId}/menu',
        method: 'GET',
        thinkTime: 2000
      },
      {
        name: 'Place Order',
        weight: 25,
        endpoint: '/api/v1/orders',
        method: 'POST',
        thinkTime: 30000    // 30 seconds order creation
      },
      {
        name: 'Process Payment',
        weight: 20,
        endpoint: '/api/v1/payments/card',
        method: 'POST',
        thinkTime: 5000
      },
      {
        name: 'Check Order Status',
        weight: 15,
        endpoint: '/api/v1/orders/{orderId}',
        method: 'GET',
        thinkTime: 10000
      }
    ],
    acceptanceCriteria: {
      responseTime: 500,    // 500ms 95th percentile
      errorRate: 1,         // 1% maximum error rate
      throughput: 500       // 500 requests/second minimum
    }
  },

  {
    name: 'Payment Gateway Stress Test',
    description: 'High-volume payment processing',
    duration: 600,         // 10 minutes
    users: {
      initial: 50,
      rampUp: 10,
      peak: 500,
      rampDown: 5
    },
    operations: [
      {
        name: 'Card Payment',
        weight: 60,
        endpoint: '/api/v1/payments/card',
        method: 'POST',
        thinkTime: 1000
      },
      {
        name: 'QR Payment',
        weight: 25,
        endpoint: '/api/v1/payments/qr-code',
        method: 'POST',
        thinkTime: 2000
      },
      {
        name: 'Credit Payment',
        weight: 15,
        endpoint: '/api/v1/payments/credit',
        method: 'POST',
        thinkTime: 500
      }
    ],
    acceptanceCriteria: {
      responseTime: 1000,   // 1s 95th percentile
      errorRate: 0.5,       // 0.5% maximum error rate
      throughput: 200       // 200 payments/second minimum
    }
  },

  {
    name: 'WebSocket Connection Stress',
    description: 'Test real-time communication under load',
    duration: 900,         // 15 minutes
    users: {
      initial: 100,
      rampUp: 20,
      peak: 2000,
      rampDown: 10
    },
    operations: [
      {
        name: 'Establish Connection',
        weight: 10,
        endpoint: 'ws://localhost:3001/v1',
        method: 'GET',
        thinkTime: 0
      },
      {
        name: 'Subscribe to Orders',
        weight: 30,
        endpoint: 'websocket-message',
        method: 'POST',
        thinkTime: 1000
      },
      {
        name: 'Order Status Update',
        weight: 40,
        endpoint: 'websocket-message',
        method: 'POST',
        thinkTime: 5000
      },
      {
        name: 'Heartbeat',
        weight: 20,
        endpoint: 'websocket-ping',
        method: 'POST',
        thinkTime: 30000
      }
    ],
    acceptanceCriteria: {
      responseTime: 100,    // 100ms message delivery
      errorRate: 0.1,       // 0.1% connection failure rate
      throughput: 1000      // 1000 messages/second
    }
  }
];
```

### 3.2 Performance Testing Tools Configuration

```typescript
// K6 Load Testing Configuration
export const k6Config = {
  scenarios: {
    peak_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 100 },   // Ramp up to 100 users
        { duration: '10m', target: 500 },  // Ramp up to 500 users
        { duration: '15m', target: 1000 }, // Peak load
        { duration: '5m', target: 0 }      // Ramp down
      ],
      gracefulRampDown: '30s'
    },
    soak_test: {
      executor: 'constant-vus',
      vus: 200,
      duration: '2h',
      gracefulStop: '30s'
    }
  },
  thresholds: {
    'http_req_duration': ['p(95)<500'],      // 95% of requests under 500ms
    'http_req_failed': ['rate<0.01'],        // Error rate under 1%
    'websocket_connecting': ['p(95)<1000'],  // WebSocket connection under 1s
    'websocket_msgs_sent': ['rate>100']      // At least 100 messages/second
  },
  ext: {
    loadimpact: {
      distribution: {
        'amazon:eu:dublin': { loadZone: 'amazon:eu:dublin', percent: 50 },
        'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 30 },
        'amazon:ap:singapore': { loadZone: 'amazon:ap:singapore', percent: 20 }
      }
    }
  }
};

// Artillery.io Configuration
export const artilleryConfig = {
  config: {
    target: 'https://api.table-tap.com',
    phases: [
      { duration: 60, arrivalRate: 10, name: 'Warm up' },
      { duration: 300, arrivalRate: 50, name: 'Ramp up load' },
      { duration: 600, arrivalRate: 100, name: 'Sustained load' }
    ],
    payload: {
      path: './test-data.csv',
      fields: ['cafeId', 'customerId', 'menuItemId']
    }
  },
  scenarios: [
    {
      name: 'Order Flow',
      weight: 70,
      flow: [
        { get: { url: '/api/v1/cafes/{{ cafeId }}/menu' } },
        { think: 5 },
        {
          post: {
            url: '/api/v1/orders',
            json: {
              cafeId: '{{ cafeId }}',
              customerId: '{{ customerId }}',
              items: [{ menuItemId: '{{ menuItemId }}', quantity: 1 }]
            }
          },
          capture: { json: '$.id', as: 'orderId' }
        },
        { think: 2 },
        {
          post: {
            url: '/api/v1/payments/card',
            json: {
              orderId: '{{ orderId }}',
              amount: 15.50,
              paymentMethod: { type: 'card' }
            }
          }
        }
      ]
    }
  ]
};
```

## 4. Monitoring & Alerting

### 4.1 Performance Monitoring Metrics

```typescript
interface PerformanceMetrics {
  // Response time metrics
  responseTime: {
    mean: number;
    median: number;
    p95: number;
    p99: number;
    max: number;
  };

  // Throughput metrics
  throughput: {
    requestsPerSecond: number;
    ordersPerMinute: number;
    paymentsPerMinute: number;
  };

  // Error metrics
  errors: {
    errorRate: number;        // Percentage
    timeoutRate: number;      // Percentage
    errorsByType: Record<string, number>;
  };

  // Resource utilization
  resources: {
    cpuUtilization: number;   // Percentage
    memoryUtilization: number; // Percentage
    diskUtilization: number;  // Percentage
    networkUtilization: number; // Percentage
  };

  // Database metrics
  database: {
    connectionPoolUtilization: number;
    queryResponseTime: number;
    lockWaitTime: number;
    transactionThroughput: number;
  };

  // Cache metrics
  cache: {
    hitRate: number;          // Percentage
    missRate: number;         // Percentage
    evictionRate: number;     // Items per second
  };

  // WebSocket metrics
  websocket: {
    activeConnections: number;
    messagesPerSecond: number;
    connectionSetupTime: number;
    messageLatency: number;
  };
}

// Monitoring thresholds for alerting
const alertThresholds = {
  critical: {
    responseTime: { p95: 1000, p99: 2000 },    // ms
    errorRate: 5,                               // %
    cpuUtilization: 90,                         // %
    memoryUtilization: 90,                      // %
    databaseConnectionPool: 90                  // %
  },
  warning: {
    responseTime: { p95: 500, p99: 1000 },     // ms
    errorRate: 2,                               // %
    cpuUtilization: 70,                         // %
    memoryUtilization: 70,                      // %
    databaseConnectionPool: 70                  // %
  }
};
```

### 4.2 Alerting Configuration

```typescript
interface AlertConfig {
  name: string;
  condition: string;
  severity: 'critical' | 'warning' | 'info';
  cooldown: number;      // Seconds before re-alerting
  notifications: {
    slack?: {
      channel: string;
      webhook: string;
    };
    email?: string[];
    pagerduty?: {
      serviceKey: string;
    };
  };
  escalation?: {
    delay: number;       // Minutes before escalation
    target: string;      // Escalation target
  };
}

const performanceAlerts: AlertConfig[] = [
  {
    name: 'High API Response Time',
    condition: 'avg(http_request_duration_ms) > 500 for 5 minutes',
    severity: 'warning',
    cooldown: 300,
    notifications: {
      slack: {
        channel: '#alerts-performance',
        webhook: process.env.SLACK_WEBHOOK_URL
      }
    }
  },
  {
    name: 'Critical API Response Time',
    condition: 'p95(http_request_duration_ms) > 1000 for 2 minutes',
    severity: 'critical',
    cooldown: 180,
    notifications: {
      slack: {
        channel: '#alerts-critical',
        webhook: process.env.SLACK_CRITICAL_WEBHOOK
      },
      email: ['devops@table-tap.com', 'engineering@table-tap.com'],
      pagerduty: {
        serviceKey: process.env.PAGERDUTY_SERVICE_KEY
      }
    },
    escalation: {
      delay: 15,
      target: 'engineering-manager'
    }
  },
  {
    name: 'High Error Rate',
    condition: 'rate(http_requests_total{status=~"5.."}[5m]) > 0.02',
    severity: 'critical',
    cooldown: 120,
    notifications: {
      slack: {
        channel: '#alerts-critical',
        webhook: process.env.SLACK_CRITICAL_WEBHOOK
      },
      pagerduty: {
        serviceKey: process.env.PAGERDUTY_SERVICE_KEY
      }
    }
  },
  {
    name: 'Database Performance Degradation',
    condition: 'avg(postgres_query_duration_ms) > 100 for 3 minutes',
    severity: 'warning',
    cooldown: 600,
    notifications: {
      slack: {
        channel: '#alerts-database',
        webhook: process.env.SLACK_WEBHOOK_URL
      }
    }
  },
  {
    name: 'Payment Gateway Timeout',
    condition: 'rate(payment_gateway_timeouts_total[5m]) > 0.01',
    severity: 'critical',
    cooldown: 60,
    notifications: {
      slack: {
        channel: '#alerts-payments',
        webhook: process.env.SLACK_CRITICAL_WEBHOOK
      },
      email: ['payments@table-tap.com']
    }
  }
];
```

## 5. Performance Optimization Strategies

### 5.1 Caching Strategy

```typescript
interface CachingConfiguration {
  layers: {
    cdn: {
      provider: 'CloudFlare' | 'AWS CloudFront';
      ttl: Record<string, number>; // TTL by content type
      purgeStrategy: 'immediate' | 'lazy';
    };
    applicationCache: {
      provider: 'Redis' | 'Memcached';
      ttl: Record<string, number>; // TTL by data type
      maxMemory: string;
      evictionPolicy: 'lru' | 'lfu' | 'allkeys-random';
    };
    databaseCache: {
      queryCache: boolean;
      resultCache: boolean;
      connectionPool: {
        min: number;
        max: number;
        idleTimeout: number;
      };
    };
  };
}

const cachingConfig: CachingConfiguration = {
  layers: {
    cdn: {
      provider: 'CloudFlare',
      ttl: {
        'static-assets': 31536000,     // 1 year
        'menu-images': 86400,          // 24 hours
        'api-responses': 300           // 5 minutes
      },
      purgeStrategy: 'immediate'
    },
    applicationCache: {
      provider: 'Redis',
      ttl: {
        'menu-data': 3600,             // 1 hour
        'cafe-info': 7200,             // 2 hours
        'user-sessions': 86400,        // 24 hours
        'order-status': 300            // 5 minutes
      },
      maxMemory: '2GB',
      evictionPolicy: 'lru'
    },
    databaseCache: {
      queryCache: true,
      resultCache: true,
      connectionPool: {
        min: 5,
        max: 20,
        idleTimeout: 30000
      }
    }
  }
};
```

### 5.2 Database Optimization

```sql
-- Index optimization for common queries
CREATE INDEX CONCURRENTLY idx_orders_cafe_status_created
ON orders (cafe_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_order_items_menu_item
ON order_items (menu_item_id);

CREATE INDEX CONCURRENTLY idx_transactions_order_status
ON transactions (order_id, status);

-- Partitioning strategy for large tables
CREATE TABLE orders_2024_q1 PARTITION OF orders
FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE orders_2024_q2 PARTITION OF orders
FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Query optimization
EXPLAIN (ANALYZE, BUFFERS)
SELECT o.*, oi.*
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.cafe_id = $1
  AND o.status = 'pending'
  AND o.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY o.created_at DESC;
```

### 5.3 Auto-scaling Configuration

```typescript
interface AutoScalingConfig {
  application: {
    minInstances: number;
    maxInstances: number;
    targetCpuUtilization: number;
    targetMemoryUtilization: number;
    scaleUpCooldown: number;    // Seconds
    scaleDownCooldown: number;  // Seconds
  };
  database: {
    readReplicas: {
      min: number;
      max: number;
      cpuThreshold: number;
      lagThreshold: number;     // Milliseconds
    };
    connectionPooling: {
      minConnections: number;
      maxConnections: number;
      dynamicScaling: boolean;
    };
  };
  cache: {
    memory: {
      scaleUpThreshold: number;   // Percentage
      scaleDownThreshold: number; // Percentage
    };
  };
}

const autoScalingConfig: AutoScalingConfig = {
  application: {
    minInstances: 3,
    maxInstances: 20,
    targetCpuUtilization: 70,
    targetMemoryUtilization: 70,
    scaleUpCooldown: 300,       // 5 minutes
    scaleDownCooldown: 600      // 10 minutes
  },
  database: {
    readReplicas: {
      min: 2,
      max: 5,
      cpuThreshold: 80,
      lagThreshold: 1000        // 1 second
    },
    connectionPooling: {
      minConnections: 10,
      maxConnections: 100,
      dynamicScaling: true
    }
  },
  cache: {
    memory: {
      scaleUpThreshold: 80,     // 80%
      scaleDownThreshold: 40    // 40%
    }
  }
};
```

This comprehensive performance specification ensures the restaurant ordering system can handle high loads while maintaining excellent user experience and meeting all SLA requirements.