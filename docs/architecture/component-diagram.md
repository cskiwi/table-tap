# Component Architecture Diagram

## Detailed Component Structure

### Frontend Layer Components

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND APPLICATIONS                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Customer  │  │  Employee   │  │    Admin Dashboard  │  │
│  │     App     │  │     App     │  │                     │  │
│  │             │  │             │  │                     │  │
│  │ • Ordering  │  │ • Orders    │  │ • Analytics        │  │
│  │ • Payment   │  │ • Timesheet │  │ • Configuration    │  │
│  │ • Status    │  │ • Inventory │  │ • User Management  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Auth     │  │   Routing   │  │    Rate Limiting    │  │
│  │  Middleware │  │  Middleware │  │     Middleware      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Backend Microservices Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  MICROSERVICES LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │               ORDER SERVICE                             ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │   Order     │  │   Counter   │  │     Status      │ ││
│  │  │ Controller  │  │ Management  │  │   Workflow      │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  │                                                         ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │   Queue     │  │ WebSocket   │  │   Notification  │ ││
│  │  │ Management  │  │   Events    │  │    Service      │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              PAYMENT SERVICE                            ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │   Payment   │  │   Gateway   │  │       QR        │ ││
│  │  │ Controller  │  │  Adapter    │  │   Generator     │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  │                                                         ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │    Tip      │  │   Credit    │  │   Transaction   │ ││
│  │  │ Calculator  │  │   Manager   │  │     Logger      │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │             INVENTORY SERVICE                           ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │  Inventory  │  │   Stock     │  │    Purchase     │ ││
│  │  │ Controller  │  │  Monitor    │  │    Tracker      │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  │                                                         ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │   Glass     │  │ Analytics   │  │    Reorder      │ ││
│  │  │  Tracker    │  │  Generator  │  │   Alerting      │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │             EMPLOYEE SERVICE                            ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │  Employee   │  │ Timesheet   │  │     Proxy       │ ││
│  │  │ Controller  │  │   Manager   │  │    Ordering     │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  │                                                         ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │   Drink     │  │    Audit    │  │   Permission    │ ││
│  │  │  Tracker    │  │    Trail    │  │    Manager      │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │           CONFIGURATION SERVICE                         ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │   Config    │  │    Menu     │  │    Workflow     │ ││
│  │  │ Controller  │  │  Manager    │  │    Designer     │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  │                                                         ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │    Cafe     │  │  Payment    │  │    Feature      │ ││
│  │  │  Settings   │  │   Config    │  │     Flags       │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Data & Infrastructure Layer

```
┌─────────────────────────────────────────────────────────────┐
│               DATA & MESSAGING LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              POSTGRESQL DATABASE                        ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │   Orders    │  │  Inventory  │  │   Employees     │ ││
│  │  │  Schema     │  │   Schema    │  │    Schema       │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  │                                                         ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │  Payments   │  │   Config    │  │    Analytics    │ ││
│  │  │   Schema    │  │   Schema    │  │     Schema      │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                REDIS CACHE                              ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │   Session   │  │   Orders    │  │    Inventory    │ ││
│  │  │    Cache    │  │   Cache     │  │     Cache       │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  │                                                         ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │   Config    │  │   Real-time │  │    Analytics    │ ││
│  │  │    Cache    │  │    Events   │  │     Cache       │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              WEBSOCKET SERVER                           ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │    Order    │  │ Inventory   │  │    Employee     │ ││
│  │  │   Events    │  │   Events    │  │     Events      │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  │                                                         ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │ Connection  │  │  Namespace  │  │     Event       │ ││
│  │  │  Manager    │  │   Manager   │  │   Dispatcher    │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │               FILE STORAGE                              ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │   Receipt   │  │    Menu     │  │    Employee     │ ││
│  │  │   Images    │  │   Images    │  │     Photos      │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  │                                                         ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │    QR       │  │   Export    │  │    Backup       │ ││
│  │  │   Codes     │  │   Files     │  │     Files       │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Component Communication Patterns

### Synchronous Communication
- **API Gateway ↔ Services**: HTTP/REST
- **Frontend ↔ API Gateway**: HTTP/REST + GraphQL
- **Service ↔ Database**: SQL queries
- **Service ↔ Redis**: Key-value operations

### Asynchronous Communication
- **Service ↔ WebSocket Server**: Event publishing
- **WebSocket Server ↔ Clients**: Real-time events
- **Service ↔ Message Queue**: Background jobs
- **Services ↔ External APIs**: Webhook callbacks

### Event-Driven Architecture

```
Order Placed → [Order Service] → Publishes Events:
  ├── order.created → [Inventory Service] → Update stock
  ├── order.created → [Payment Service] → Process payment
  ├── order.created → [WebSocket] → Notify clients
  └── order.created → [Analytics] → Track metrics

Payment Completed → [Payment Service] → Publishes Events:
  ├── payment.completed → [Order Service] → Update status
  ├── payment.completed → [WebSocket] → Notify clients
  └── payment.completed → [Analytics] → Track revenue

Inventory Low → [Inventory Service] → Publishes Events:
  ├── inventory.low → [WebSocket] → Alert managers
  └── inventory.low → [Notification] → Send alerts
```

## Security Boundaries

### External Boundary
- **Web Application Firewall (WAF)**
- **DDoS Protection**
- **SSL/TLS Termination**

### API Gateway Security
- **Authentication Validation**
- **Rate Limiting**
- **Input Sanitization**
- **CORS Handling**

### Service-to-Service Security
- **JWT Token Validation**
- **Service Mesh (Optional)**
- **Network Policies**
- **Encryption in Transit**

### Data Layer Security
- **Database Connection Pooling**
- **Query Parameterization**
- **Row-Level Security**
- **Encryption at Rest**

This component architecture ensures clear separation of concerns, scalability, and maintainability while providing robust security and real-time capabilities for the Table Tap ordering system.