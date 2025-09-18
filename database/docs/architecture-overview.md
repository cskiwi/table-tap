# Restaurant Ordering System - Database Architecture Overview

## System Architecture

### Core Design Principles
- **Multi-tenant architecture** with cafe-level isolation
- **GDPR compliant** with explicit data retention policies
- **Audit trail** for all financial transactions
- **Role-based access control** with hierarchical permissions
- **Scalable inventory management** with real-time tracking
- **Flexible configuration** for cafe-specific business rules

### Entity Categories

#### 1. Core Entities
- **Cafes**: Multi-tenant support with isolated data
- **Users**: Customers, employees, admins with role hierarchy
- **Products**: Drinks, food with dynamic categorization
- **Orders & OrderItems**: Complete order lifecycle management
- **Payments & Transactions**: Multi-payment method support
- **Counters**: Physical service points with assignments

#### 2. Inventory Management
- **Stock**: Real-time inventory levels and tracking
- **Purchases**: Receipt-based purchase records
- **Suppliers**: Vendor management and relationships
- **Reorder Management**: Automated threshold-based reordering
- **Glass Inventory**: Optional specialized glass tracking

#### 3. Employee Management
- **Employee Profiles**: Extended user information
- **Time Sheets**: Work session tracking and payroll
- **Personal Consumption**: Employee purchase attribution
- **Proxy Orders**: Orders placed on behalf of customers

#### 4. Configuration & Settings
- **Cafe Settings**: Business-specific configurations
- **Payment Methods**: Supported payment configurations
- **Order Workflow**: Customizable order states and transitions
- **Counter Configurations**: Physical setup and assignments
- **Tip Calculations**: Configurable tip distribution rules

### Data Retention & Compliance

#### GDPR Compliance
- **Data minimization**: Only collect necessary data
- **Right to deletion**: Soft delete with anonymization
- **Data portability**: Export functionality for user data
- **Consent management**: Explicit opt-in for marketing
- **Audit logs**: Complete tracking of data access and modifications

#### Retention Policies
- **Transaction Data**: 7 years (legal requirement)
- **User Activity**: 2 years after last activity
- **Employee Records**: 7 years after employment end
- **Inventory Records**: 3 years for tax purposes
- **Audit Logs**: 10 years for compliance

### Performance Considerations
- **Partitioning**: Orders and transactions by date
- **Indexing**: Optimized for common query patterns
- **Caching**: Redis for session and frequent lookups
- **Read Replicas**: For reporting and analytics
- **Connection Pooling**: Efficient database connections

### Security Framework
- **Encryption at rest**: All sensitive data encrypted
- **Row-level security**: Cafe-based data isolation
- **API rate limiting**: Prevent abuse and DoS
- **Input validation**: SQL injection prevention
- **Audit trail**: Complete action logging