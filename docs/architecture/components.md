# TableTap Component Architecture Diagram

## C4 Model - Component Level (Level 3)

### Order Management Service Components

```mermaid
graph TB
    subgraph "Order Management Service"
        OC[Order Controller]
        OS[Order Service]
        OV[Order Validator]
        OR[Order Repository]
        ON[Order Notifier]
        OP[Order Processor]

        OC --> OS
        OS --> OV
        OS --> OR
        OS --> ON
        OS --> OP
    end

    subgraph "Kitchen Operations Service"
        KC[Kitchen Controller]
        KS[Kitchen Service]
        KDS[Kitchen Display]
        WO[Workflow Optimizer]
        TS[Task Scheduler]
        SM[Station Manager]

        KC --> KS
        KS --> KDS
        KS --> WO
        WO --> TS
        TS --> SM
    end

    subgraph "Employee Management Service"
        EC[Employee Controller]
        ES[Employee Service]
        PM[Performance Monitor]
        SC[Schedule Controller]
        TR[Time Tracker]
        PA[Performance Analytics]

        EC --> ES
        ES --> PM
        ES --> SC
        ES --> TR
        PM --> PA
    end

    subgraph "Inventory Management Service"
        IC[Inventory Controller]
        IS[Inventory Service]
        SL[Stock Level Monitor]
        AO[Auto Ordering]
        SI[Supplier Integration]
        CA[Cost Analytics]

        IC --> IS
        IS --> SL
        IS --> AO
        IS --> SI
        SL --> AO
        IS --> CA
    end

    subgraph "Shared Services"
        EB[Event Bus]
        DB[(PostgreSQL)]
        RD[(Redis Cache)]
        MQ[Message Queue]
        AU[Auth Service]

        OS --> EB
        KS --> EB
        ES --> EB
        IS --> EB

        OR --> DB
        PM --> DB
        IS --> DB

        OS --> RD
        KS --> RD
        ES --> RD

        OP --> MQ
        WO --> MQ
        AO --> MQ
    end

    subgraph "External Systems"
        POS[POS Systems]
        PAY[Payment Gateway]
        SUP[Suppliers]
        BI[Business Intelligence]

        OC --> POS
        OP --> PAY
        SI --> SUP
        PA --> BI
    end
```

## Data Flow Architecture

### Real-Time Order Processing Flow

```mermaid
sequenceDiagram
    participant C as Customer App
    participant API as API Gateway
    participant OS as Order Service
    participant KS as Kitchen Service
    participant ES as Employee Service
    participant WS as WebSocket Gateway
    participant DB as Database
    participant MQ as Message Queue

    C->>API: Create Order
    API->>OS: Process Order
    OS->>DB: Save Order
    OS->>MQ: Order Created Event

    MQ->>KS: Order Received
    KS->>ES: Assign Staff
    KS->>WS: Kitchen Update

    KS->>DB: Update Order Status
    KS->>MQ: Status Change Event

    MQ->>WS: Broadcast Status
    WS->>C: Real-time Update

    Note over KS: Kitchen Workflow Optimization
    KS->>KS: Calculate Prep Time
    KS->>ES: Task Assignment
    KS->>WS: Kitchen Display Update
```

## Multi-Tenant Architecture

### Tenant Isolation Strategy

```mermaid
graph TB
    subgraph "Tenant A (Restaurant Chain A)"
        TA_API[API Gateway A]
        TA_DB[(Database Schema A)]
        TA_CACHE[(Cache Namespace A)]

        TA_API --> TA_DB
        TA_API --> TA_CACHE
    end

    subgraph "Tenant B (Restaurant Chain B)"
        TB_API[API Gateway B]
        TB_DB[(Database Schema B)]
        TB_CACHE[(Cache Namespace B)]

        TB_API --> TB_DB
        TB_API --> TB_CACHE
    end

    subgraph "Shared Infrastructure"
        LB[Load Balancer]
        AUTH[Auth Service]
        MONITOR[Monitoring]
        LOG[Logging]

        LB --> TA_API
        LB --> TB_API

        TA_API --> AUTH
        TB_API --> AUTH

        TA_API --> MONITOR
        TB_API --> MONITOR

        TA_API --> LOG
        TB_API --> LOG
    end
```

This component architecture provides a detailed view of how each service is structured internally and how they interact with each other and external systems.