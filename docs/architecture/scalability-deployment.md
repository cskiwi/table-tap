# Scalability Architecture & Deployment Strategy

## Scalability Principles

### Horizontal Scaling Strategy
The Table Tap system is designed for horizontal scaling across all tiers to handle growth from single cafe to enterprise multi-location deployment.

### Performance Targets
- **Response Time**: < 200ms for API calls
- **Throughput**: 10,000+ concurrent orders
- **Availability**: 99.9% uptime (8.76 hours downtime/year)
- **Scalability**: Support 1,000+ cafes with 100+ concurrent users each

## Architecture Scaling Patterns

### Microservices Scaling
```yaml
# Kubernetes deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order-service
        image: tabletap/order-service:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
---
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Scaling Strategy

#### Read Replicas Configuration
```yaml
# PostgreSQL primary-replica setup
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-cluster
spec:
  instances: 3
  primaryUpdateStrategy: unsupervised

  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "256MB"
      effective_cache_size: "1GB"
      maintenance_work_mem: "64MB"
      checkpoint_completion_target: "0.9"
      wal_buffers: "16MB"
      default_statistics_target: "100"
      random_page_cost: "1.1"
      effective_io_concurrency: "200"

  resources:
    requests:
      memory: "1Gi"
      cpu: "500m"
    limits:
      memory: "2Gi"
      cpu: "1000m"

  storage:
    size: "100Gi"
    storageClass: "fast-ssd"

  monitoring:
    enabled: true

  backup:
    schedule: "0 2 * * *"
    backupOwnerReference: self
```

#### Database Sharding Strategy
```sql
-- Cafe-based sharding for multi-tenant scaling
-- Shard key: cafe_id
-- Each shard contains complete data for a set of cafes

-- Shard routing configuration
CREATE TABLE shard_routing (
    cafe_id UUID PRIMARY KEY,
    shard_id INTEGER NOT NULL,
    shard_endpoint VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Distributed query routing service
```

```typescript
@Injectable()
export class ShardingService {
  private shardMap: Map<string, string> = new Map();

  async getShardForCafe(cafeId: string): Promise<string> {
    // Consistent hashing for shard selection
    const hash = this.consistentHash(cafeId);
    const shardIndex = hash % this.totalShards;
    return this.shards[shardIndex];
  }

  async routeQuery(cafeId: string, query: string, params: any[]): Promise<any> {
    const shardEndpoint = await this.getShardForCafe(cafeId);
    const connection = this.getConnection(shardEndpoint);
    return connection.query(query, params);
  }

  private consistentHash(key: string): number {
    // Implement consistent hashing algorithm
    return crypto.createHash('sha256')
      .update(key)
      .digest()
      .readUInt32BE(0);
  }
}
```

### Caching Strategy

#### Multi-Level Caching Architecture
```typescript
// L1: Application-level caching (in-memory)
// L2: Distributed cache (Redis)
// L3: Database query result cache

@Injectable()
export class CacheService {
  private l1Cache = new Map<string, any>();
  private readonly L1_TTL = 60 * 1000; // 1 minute
  private readonly L2_TTL = 300; // 5 minutes

  async get<T>(key: string): Promise<T | null> {
    // L1 Cache check
    const l1Result = this.l1Cache.get(key);
    if (l1Result && l1Result.expires > Date.now()) {
      return l1Result.value;
    }

    // L2 Cache check (Redis)
    const l2Result = await this.redisClient.get(key);
    if (l2Result) {
      const value = JSON.parse(l2Result);

      // Populate L1 cache
      this.l1Cache.set(key, {
        value,
        expires: Date.now() + this.L1_TTL
      });

      return value;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Set in both L1 and L2 caches
    this.l1Cache.set(key, {
      value,
      expires: Date.now() + this.L1_TTL
    });

    await this.redisClient.setex(
      key,
      ttl || this.L2_TTL,
      JSON.stringify(value)
    );
  }

  async invalidate(pattern: string): Promise<void> {
    // Invalidate L1 cache
    for (const key of this.l1Cache.keys()) {
      if (this.matchPattern(key, pattern)) {
        this.l1Cache.delete(key);
      }
    }

    // Invalidate L2 cache
    const keys = await this.redisClient.keys(pattern);
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }
}

// Cache warming strategy
@Injectable()
export class CacheWarmingService {
  @Cron('*/5 * * * *') // Every 5 minutes
  async warmMenuCache(): Promise<void> {
    const activeCafes = await this.cafeService.getActiveCafes();

    for (const cafe of activeCafes) {
      const menu = await this.menuService.getFullMenu(cafe.id);
      await this.cacheService.set(
        `menu:${cafe.id}`,
        menu,
        600 // 10 minutes
      );
    }
  }

  @Cron('0 */1 * * *') // Every hour
  async warmAnalyticsCache(): Promise<void> {
    const cafes = await this.cafeService.getActiveCafes();

    for (const cafe of cafes) {
      const analytics = await this.analyticsService.getDashboardData(cafe.id);
      await this.cacheService.set(
        `analytics:dashboard:${cafe.id}`,
        analytics,
        3600 // 1 hour
      );
    }
  }
}
```

### WebSocket Scaling

#### Redis-based WebSocket Clustering
```typescript
// WebSocket cluster adapter using Redis
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({
      url: process.env.REDIS_URL,
    });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}

// Load balancing WebSocket connections
@WebSocketGateway({
  transports: ['websocket'],
  cors: {
    origin: process.env.FRONTEND_URL,
  }
})
export class ScalableOrderGateway {
  @WebSocketServer()
  server: Server;

  // Broadcast to all instances in the cluster
  async broadcastToAllServers(event: string, data: any): Promise<void> {
    this.server.emit(event, data);
  }

  // Broadcast to specific cafe across all instances
  async broadcastToCafe(cafeId: string, event: string, data: any): Promise<void> {
    this.server.to(`cafe:${cafeId}`).emit(event, data);
  }

  // Handle connection with session affinity
  @SubscribeMessage('join_cafe')
  async handleJoinCafe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { cafe_id: string }
  ): Promise<void> {
    await client.join(`cafe:${data.cafe_id}`);

    // Store connection info for load balancing
    await this.redisClient.sadd(
      `websocket:cafe:${data.cafe_id}`,
      `${process.env.INSTANCE_ID}:${client.id}`
    );
  }
}
```

## Load Balancing Strategy

### Application Load Balancer Configuration
```yaml
# HAProxy configuration for application load balancing
global
    daemon
    log stdout local0
    maxconn 4096

defaults
    mode http
    timeout connect 5s
    timeout client 50s
    timeout server 50s
    option httplog
    option dontlognull

frontend api_frontend
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/tabletap.pem
    redirect scheme https if !{ ssl_fc }

    # Rate limiting
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request track-sc0 src
    http-request reject if { sc_http_req_rate(0) gt 20 }

    # Route based on path
    acl is_api path_beg /api/
    acl is_websocket hdr(upgrade) -i websocket

    use_backend websocket_backend if is_websocket
    use_backend api_backend if is_api
    default_backend api_backend

backend api_backend
    balance roundrobin
    option httpchk GET /health

    server api1 api-service-1:3000 check
    server api2 api-service-2:3000 check
    server api3 api-service-3:3000 check

backend websocket_backend
    balance source
    option httpchk GET /health

    server ws1 websocket-service-1:3001 check
    server ws2 websocket-service-2:3001 check
    server ws3 websocket-service-3:3001 check
```

### Database Load Balancing
```typescript
// Database connection pooling with read/write splitting
@Injectable()
export class DatabaseService {
  private writePool: Pool;
  private readPools: Pool[];

  constructor() {
    // Master connection pool (writes)
    this.writePool = new Pool({
      connectionString: process.env.DATABASE_WRITE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Read replica pools
    this.readPools = [
      new Pool({ connectionString: process.env.DATABASE_READ_URL_1, max: 20 }),
      new Pool({ connectionString: process.env.DATABASE_READ_URL_2, max: 20 }),
      new Pool({ connectionString: process.env.DATABASE_READ_URL_3, max: 20 }),
    ];
  }

  async query(sql: string, params: any[], forceWrite = false): Promise<any> {
    const isWriteQuery = this.isWriteOperation(sql) || forceWrite;

    if (isWriteQuery) {
      return this.writePool.query(sql, params);
    } else {
      // Round-robin read replica selection
      const replicaIndex = Math.floor(Math.random() * this.readPools.length);
      const readPool = this.readPools[replicaIndex];

      try {
        return await readPool.query(sql, params);
      } catch (error) {
        // Fallback to master if read replica fails
        console.warn('Read replica failed, falling back to master:', error);
        return this.writePool.query(sql, params);
      }
    }
  }

  private isWriteOperation(sql: string): boolean {
    const writeKeywords = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'];
    const upperSql = sql.trim().toUpperCase();
    return writeKeywords.some(keyword => upperSql.startsWith(keyword));
  }
}
```

## Auto-Scaling Configuration

### Kubernetes Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: table-tap-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: table-tap-api
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: websocket_connections
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

### Custom Metrics for Scaling
```typescript
// Custom metrics service for autoscaling decisions
@Injectable()
export class MetricsService {
  private metricsServer: any;

  async recordOrderThroughput(cafeId: string, orderCount: number): Promise<void> {
    // Record order processing throughput
    this.metricsServer.histogram('order_processing_rate', orderCount, {
      cafe_id: cafeId,
      timestamp: Date.now()
    });
  }

  async recordWebSocketConnections(count: number): Promise<void> {
    this.metricsServer.gauge('websocket_connections_active', count);
  }

  async recordDatabaseLatency(operation: string, latencyMs: number): Promise<void> {
    this.metricsServer.histogram('database_query_duration_ms', latencyMs, {
      operation
    });
  }

  async recordCacheHitRate(hitRate: number): Promise<void> {
    this.metricsServer.gauge('cache_hit_rate', hitRate);
  }
}

// Performance monitoring decorator
export function MonitorPerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;

        await this.metricsService.recordPerformanceMetric(operation, duration, true);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        await this.metricsService.recordPerformanceMetric(operation, duration, false);
        throw error;
      }
    };
  };
}
```

## Deployment Environments

### Development Environment
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:pass@postgres:5432/tabletap_dev
      - REDIS_URL=redis://redis:6379
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: tabletap_dev
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_dev_data:
```

### Staging Environment
```yaml
# kubernetes/staging/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: table-tap-staging
  namespace: staging
spec:
  replicas: 2
  selector:
    matchLabels:
      app: table-tap
      env: staging
  template:
    metadata:
      labels:
        app: table-tap
        env: staging
    spec:
      containers:
      - name: api
        image: tabletap/api:staging-latest
        env:
        - name: NODE_ENV
          value: "staging"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: staging-secrets
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Production Environment
```yaml
# kubernetes/production/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: table-tap-production
  namespace: production
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: table-tap
      env: production
  template:
    metadata:
      labels:
        app: table-tap
        env: production
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - table-tap
            topologyKey: kubernetes.io/hostname
      containers:
      - name: api
        image: tabletap/api:v1.2.3
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: production-secrets
              key: database-url
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          capabilities:
            drop:
              - ALL
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 60
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
```

## Monitoring & Observability

### Application Performance Monitoring
```typescript
// APM integration with detailed tracing
@Injectable()
export class TracingService {
  private tracer: Tracer;

  constructor() {
    this.tracer = trace.getTracer('table-tap-api');
  }

  async traceOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    attributes?: any
  ): Promise<T> {
    return this.tracer.startActiveSpan(operationName, { attributes }, async (span) => {
      try {
        const result = await operation();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
```

### Health Check Endpoints
```typescript
// Comprehensive health checks
@Controller('health')
export class HealthController {
  constructor(
    private databaseService: DatabaseService,
    private redisService: RedisService,
    private paymentService: PaymentService
  ) {}

  @Get()
  async healthCheck(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalServices(),
    ]);

    const healthy = checks.every(check =>
      check.status === 'fulfilled' && check.value.healthy
    );

    return {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
      checks: checks.map((check, index) => ({
        name: ['database', 'redis', 'external_services'][index],
        status: check.status === 'fulfilled' ? 'up' : 'down',
        details: check.status === 'fulfilled' ? check.value : check.reason
      }))
    };
  }

  private async checkDatabase(): Promise<{ healthy: boolean }> {
    try {
      await this.databaseService.query('SELECT 1', []);
      return { healthy: true };
    } catch (error) {
      return { healthy: false };
    }
  }

  private async checkRedis(): Promise<{ healthy: boolean }> {
    try {
      await this.redisService.ping();
      return { healthy: true };
    } catch (error) {
      return { healthy: false };
    }
  }

  private async checkExternalServices(): Promise<{ healthy: boolean }> {
    try {
      // Check payment gateway connectivity
      await this.paymentService.healthCheck();
      return { healthy: true };
    } catch (error) {
      return { healthy: false };
    }
  }
}
```

## Disaster Recovery & Business Continuity

### Backup Strategy
```bash
#!/bin/bash
# Automated backup script

# Database backups with point-in-time recovery
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --verbose --clean --no-owner --no-privileges \
  --format=custom \
  --file="backups/tabletap_$(date +%Y%m%d_%H%M%S).backup"

# Upload to multiple cloud storage locations
aws s3 cp backups/ s3://tabletap-backups-primary/ --recursive
gsutil -m cp -r backups/ gs://tabletap-backups-secondary/

# Redis persistence backup
redis-cli --rdb backups/redis_$(date +%Y%m%d_%H%M%S).rdb

# Application state backup (file uploads, receipts, etc.)
tar -czf backups/files_$(date +%Y%m%d_%H%M%S).tar.gz /app/uploads/
```

### Geographic Distribution
```yaml
# Multi-region deployment configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: region-config
data:
  primary-region: "us-east-1"
  secondary-regions: "us-west-2,eu-west-1"
  failover-strategy: "active-passive"
  data-replication: "async"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: table-tap-primary
spec:
  replicas: 5
  template:
    spec:
      nodeSelector:
        topology.kubernetes.io/region: us-east-1
      containers:
      - name: api
        image: tabletap/api:latest
        env:
        - name: REGION
          value: "primary"
        - name: FAILOVER_ENDPOINT
          value: "https://us-west-2.tabletap.com"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: table-tap-secondary
spec:
  replicas: 2
  template:
    spec:
      nodeSelector:
        topology.kubernetes.io/region: us-west-2
      containers:
      - name: api
        image: tabletap/api:latest
        env:
        - name: REGION
          value: "secondary"
        - name: PRIMARY_ENDPOINT
          value: "https://api.tabletap.com"
```

This comprehensive scalability and deployment strategy ensures the Table Tap system can grow from a single cafe to enterprise scale while maintaining performance, reliability, and cost efficiency.