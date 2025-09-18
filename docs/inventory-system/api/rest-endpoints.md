# Inventory Management System - REST API Endpoints

## Base URL
```
https://api.tabletap.com/v1/inventory
```

## Authentication
All endpoints require authentication using JWT tokens in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All responses follow the standard format:
```json
{
  "success": true,
  "data": {...},
  "meta": {
    "pagination": {...},
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "errors": []
}
```

## Error Handling
HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## ================================
## INVENTORY CATEGORIES
## ================================

### GET /categories
Get all inventory categories for a cafe
```
GET /categories?cafeId={cafeId}&page=1&limit=20&sort=name:asc
```

**Query Parameters:**
- `cafeId` (required): Cafe ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field and direction (e.g., `name:asc`, `createdAt:desc`)
- `parentId`: Filter by parent category
- `isActive`: Filter by active status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat-123",
      "name": "Beverages",
      "description": "All drink products",
      "parentId": null,
      "sortOrder": 1,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "cafeId": "cafe-123",
      "children": [...],
      "productCount": 25
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

### GET /categories/{id}
Get a specific category
```
GET /categories/cat-123
```

### POST /categories
Create a new category
```json
{
  "cafeId": "cafe-123",
  "name": "Alcoholic Beverages",
  "description": "Beer, wine, and spirits",
  "parentId": "cat-123",
  "sortOrder": 2,
  "isActive": true
}
```

### PUT /categories/{id}
Update a category
```json
{
  "name": "Premium Beverages",
  "description": "High-end drinks",
  "sortOrder": 1
}
```

### DELETE /categories/{id}
Delete a category (soft delete)

## ================================
## STORAGE LOCATIONS
## ================================

### GET /locations
Get all storage locations
```
GET /locations?cafeId={cafeId}&type=refrigerator&isActive=true
```

**Query Parameters:**
- `cafeId` (required): Cafe ID
- `type`: Filter by location type
- `isActive`: Filter by active status

### GET /locations/{id}
Get a specific location

### POST /locations
Create a new storage location
```json
{
  "cafeId": "cafe-123",
  "name": "Main Refrigerator",
  "type": "refrigerator",
  "description": "Primary cold storage",
  "temperatureMin": 2.0,
  "temperatureMax": 8.0,
  "capacityVolume": 500.0,
  "capacityWeight": 200.0,
  "isActive": true
}
```

### PUT /locations/{id}
Update a location

### DELETE /locations/{id}
Delete a location

## ================================
## INVENTORY PRODUCTS
## ================================

### GET /products
Get all inventory products
```
GET /products?cafeId={cafeId}&categoryId={categoryId}&search=beer&lowStock=true&page=1&limit=20
```

**Query Parameters:**
- `cafeId` (required): Cafe ID
- `categoryId`: Filter by category
- `search`: Search in name, description, or SKU
- `lowStock`: Show only products below reorder point
- `expiringSoon`: Show products expiring in next N days
- `isActive`: Filter by active status
- `supplierId`: Filter by supplier
- `sort`: Sort options

### GET /products/{id}
Get a specific product with current stock levels

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prod-123",
    "name": "Premium Lager Beer",
    "description": "Local craft beer",
    "sku": "BEER-001",
    "barcode": "1234567890123",
    "unitOfMeasurement": "bottles",
    "unitCost": 2.50,
    "supplierCost": 2.00,
    "storageRequirements": "Refrigerated",
    "shelfLifeDays": 90,
    "minStockLevel": 24.0,
    "maxStockLevel": 240.0,
    "reorderPoint": 48.0,
    "reorderQuantity": 120.0,
    "isActive": true,
    "categoryId": "cat-123",
    "cafeId": "cafe-123",
    "category": {...},
    "stockLevels": [
      {
        "id": "stock-123",
        "locationId": "loc-123",
        "location": {...},
        "quantity": 36.0,
        "reservedQuantity": 6.0,
        "availableQuantity": 30.0,
        "batchNumber": "BATCH-001",
        "expirationDate": "2024-06-01",
        "costPerUnit": 2.50
      }
    ],
    "totalStock": 36.0,
    "totalAvailable": 30.0,
    "isLowStock": true,
    "daysUntilExpiration": 45
  }
}
```

### POST /products
Create a new product
```json
{
  "cafeId": "cafe-123",
  "name": "Premium Wine",
  "description": "Red wine from local vineyard",
  "sku": "WINE-001",
  "barcode": "9876543210987",
  "categoryId": "cat-456",
  "unitOfMeasurement": "bottles",
  "unitCost": 15.00,
  "supplierCost": 12.00,
  "storageRequirements": "Cool, dark place",
  "shelfLifeDays": 1825,
  "minStockLevel": 12.0,
  "maxStockLevel": 60.0,
  "reorderPoint": 18.0,
  "reorderQuantity": 36.0,
  "isActive": true
}
```

### PUT /products/{id}
Update a product

### DELETE /products/{id}
Delete a product

### POST /products/bulk-update
Bulk update multiple products
```json
{
  "updates": [
    {
      "id": "prod-123",
      "unitCost": 2.75,
      "reorderPoint": 50.0
    },
    {
      "id": "prod-124",
      "isActive": false
    }
  ]
}
```

## ================================
## STOCK MANAGEMENT
## ================================

### GET /stock
Get stock levels across all products and locations
```
GET /stock?cafeId={cafeId}&locationId={locationId}&productId={productId}&lowStock=true
```

### GET /stock/product/{productId}
Get stock levels for a specific product across all locations

### GET /stock/location/{locationId}
Get all stock in a specific location

### GET /stock/low
Get all products with low stock levels
```
GET /stock/low?cafeId={cafeId}&urgency=high
```

### GET /stock/expiring
Get stock items expiring soon
```
GET /stock/expiring?cafeId={cafeId}&days=7
```

### POST /stock
Add new stock (typically from purchase orders)
```json
{
  "productId": "prod-123",
  "locationId": "loc-123",
  "quantity": 24.0,
  "costPerUnit": 2.50,
  "batchNumber": "BATCH-002",
  "expirationDate": "2024-08-01",
  "receivedDate": "2024-01-15",
  "notes": "Fresh delivery from supplier"
}
```

### PUT /stock/{id}
Update stock record

### POST /stock/adjust
Make stock adjustments
```json
{
  "productId": "prod-123",
  "locationId": "loc-123",
  "movementType": "adjustment",
  "quantityChange": -2.0,
  "unitCost": 2.50,
  "reason": "Damaged during storage",
  "batchNumber": "BATCH-001"
}
```

### POST /stock/transfer
Transfer stock between locations
```json
{
  "productId": "prod-123",
  "fromLocationId": "loc-123",
  "toLocationId": "loc-124",
  "quantity": 12.0,
  "batchNumber": "BATCH-001",
  "reason": "Restocking bar area"
}
```

### POST /stock/waste
Record waste/shrinkage
```json
{
  "productId": "prod-123",
  "locationId": "loc-123",
  "quantity": 3.0,
  "reason": "Expired products",
  "batchNumber": "BATCH-001",
  "wasteCategory": "expiration"
}
```

### POST /stock/count
Perform inventory count
```json
{
  "cafeId": "cafe-123",
  "locationId": "loc-123",
  "counts": [
    {
      "productId": "prod-123",
      "countedQuantity": 22.0,
      "batchNumber": "BATCH-001"
    }
  ],
  "countDate": "2024-01-15T14:30:00Z",
  "countedBy": "user-123"
}
```

## ================================
## SUPPLIERS
## ================================

### GET /suppliers
Get all suppliers
```
GET /suppliers?cafeId={cafeId}&isActive=true&sort=rating:desc
```

### GET /suppliers/{id}
Get supplier details with products

### GET /suppliers/{id}/products
Get products offered by a supplier

### GET /suppliers/compare/{productId}
Compare suppliers for a specific product

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {...},
    "suppliers": [
      {
        "supplier": {...},
        "unitCost": 2.00,
        "leadTimeDays": 2,
        "minimumOrderQuantity": 24.0,
        "totalCost": 48.00,
        "rating": 4.5,
        "isPreferred": true,
        "lastPriceUpdate": "2024-01-01T00:00:00Z"
      }
    ],
    "recommendedSupplier": {...}
  }
}
```

### POST /suppliers
Create a new supplier

### PUT /suppliers/{id}
Update supplier information

### DELETE /suppliers/{id}
Delete a supplier

### POST /suppliers/{supplierId}/products
Add a product to supplier catalog
```json
{
  "productId": "prod-123",
  "supplierSku": "SUP-BEER-001",
  "unitCost": 2.00,
  "minimumOrderQuantity": 24.0,
  "leadTimeDays": 2,
  "isPreferred": true
}
```

## ================================
## PURCHASE ORDERS
## ================================

### GET /purchase-orders
Get all purchase orders
```
GET /purchase-orders?cafeId={cafeId}&supplierId={supplierId}&status=pending&page=1&limit=20
```

### GET /purchase-orders/{id}
Get purchase order details with line items

### GET /purchase-orders/pending
Get pending purchase orders requiring attention

### POST /purchase-orders
Create a new purchase order
```json
{
  "cafeId": "cafe-123",
  "supplierId": "sup-123",
  "orderDate": "2024-01-15",
  "expectedDeliveryDate": "2024-01-17",
  "notes": "Urgent order for weekend",
  "items": [
    {
      "productId": "prod-123",
      "quantityOrdered": 48.0,
      "unitCost": 2.00,
      "expirationDate": "2024-08-01"
    }
  ]
}
```

### PUT /purchase-orders/{id}
Update purchase order (only if status is 'draft')

### POST /purchase-orders/{id}/approve
Approve a purchase order

### POST /purchase-orders/{id}/send
Send purchase order to supplier

### POST /purchase-orders/{id}/receive
Receive items from purchase order
```json
{
  "actualDeliveryDate": "2024-01-17",
  "items": [
    {
      "purchaseOrderItemId": "poi-123",
      "quantityReceived": 48.0,
      "batchNumber": "BATCH-003",
      "expirationDate": "2024-08-01",
      "notes": "Good condition"
    }
  ]
}
```

### POST /purchase-orders/{id}/cancel
Cancel a purchase order

### GET /purchase-orders/generate-suggestions
Get automated reorder suggestions
```
GET /purchase-orders/generate-suggestions?cafeId={cafeId}&urgent=true
```

## ================================
## ANALYTICS AND REPORTING
## ================================

### GET /analytics/dashboard
Get inventory dashboard data
```
GET /analytics/dashboard?cafeId={cafeId}
```

### GET /analytics/performance
Get performance metrics
```
GET /analytics/performance?cafeId={cafeId}&period=monthly&startDate=2024-01-01&endDate=2024-01-31
```

### GET /analytics/products
Get product analytics
```
GET /analytics/products?cafeId={cafeId}&productIds[]=prod-123&period=weekly&startDate=2024-01-01&endDate=2024-01-31
```

### GET /analytics/valuation
Get inventory valuation
```
GET /analytics/valuation?cafeId={cafeId}&date=2024-01-15&method=FIFO
```

### GET /analytics/waste
Get waste analysis
```
GET /analytics/waste?cafeId={cafeId}&period=monthly&startDate=2024-01-01&endDate=2024-01-31
```

### GET /analytics/forecast
Get demand forecasts
```
GET /analytics/forecast?cafeId={cafeId}&productIds[]=prod-123&horizonDays=30
```

### POST /analytics/train-model
Trigger ML model training
```json
{
  "cafeId": "cafe-123",
  "modelType": "demand_forecast",
  "parameters": {
    "lookbackDays": 90,
    "includeSeasonality": true,
    "includePromotions": true
  }
}
```

## ================================
## ALERTS AND NOTIFICATIONS
## ================================

### GET /alerts
Get all alerts
```
GET /alerts?cafeId={cafeId}&status=active&severity=high&page=1&limit=20
```

### GET /alerts/active
Get active alerts

### POST /alerts/{id}/acknowledge
Acknowledge an alert

### POST /alerts/{id}/resolve
Resolve an alert

### POST /alerts/{id}/dismiss
Dismiss an alert

### GET /alert-rules
Get alert rules

### POST /alert-rules
Create alert rule
```json
{
  "cafeId": "cafe-123",
  "name": "Critical Low Stock",
  "description": "Alert when stock falls below 10% of reorder point",
  "ruleType": "low_stock",
  "conditions": {
    "threshold": 0.1,
    "severity": "critical",
    "categories": ["cat-123"]
  },
  "recipients": {
    "emails": ["manager@cafe.com"],
    "userIds": ["user-123"],
    "webhooks": ["https://api.cafe.com/webhook"]
  },
  "isActive": true
}
```

## ================================
## GLASS TRACKING (OPTIONAL)
## ================================

### GET /glass/types
Get glass types

### POST /glass/types
Create glass type

### GET /glass/inventory
Get glass inventory
```
GET /glass/inventory?cafeId={cafeId}&status=available&glassTypeId={typeId}
```

### POST /glass/inventory
Add glass to inventory

### POST /glass/checkout
Checkout glass to customer
```json
{
  "glassId": "glass-123",
  "customerId": "customer-123",
  "orderId": "order-123",
  "location": "table_5",
  "depositCharged": 5.00
}
```

### POST /glass/checkin
Check in glass from customer

### POST /glass/break
Report glass breakage

### GET /glass/transactions
Get glass transactions

### GET /glass/utilization
Get glass utilization report

## ================================
## REPORTS AND EXPORTS
## ================================

### GET /reports/inventory
Generate inventory report
```
GET /reports/inventory?cafeId={cafeId}&format=pdf&reportType=full&date=2024-01-15
```

### GET /reports/purchases
Generate purchase report
```
GET /reports/purchases?cafeId={cafeId}&format=excel&startDate=2024-01-01&endDate=2024-01-31
```

### GET /exports/products
Export product data
```
GET /exports/products?cafeId={cafeId}&format=csv&includeStock=true
```

### GET /exports/movements
Export movement history
```
GET /exports/movements?cafeId={cafeId}&format=csv&startDate=2024-01-01&endDate=2024-01-31
```

### POST /imports/products
Import product data
```
Content-Type: multipart/form-data

file: <CSV file>
cafeId: cafe-123
format: csv
updateExisting: true
```

## ================================
## WEBHOOKS
## ================================

### POST /webhooks
Create webhook subscription
```json
{
  "cafeId": "cafe-123",
  "url": "https://your-app.com/webhook",
  "events": ["stock.low", "order.received", "alert.created"],
  "secret": "your-webhook-secret"
}
```

### GET /webhooks
List webhook subscriptions

### DELETE /webhooks/{id}
Delete webhook subscription

## Webhook Event Examples

### stock.low
```json
{
  "event": "stock.low",
  "timestamp": "2024-01-15T10:30:00Z",
  "cafeId": "cafe-123",
  "data": {
    "productId": "prod-123",
    "currentStock": 15.0,
    "reorderPoint": 48.0,
    "urgency": "high"
  }
}
```

### order.received
```json
{
  "event": "order.received",
  "timestamp": "2024-01-15T14:30:00Z",
  "cafeId": "cafe-123",
  "data": {
    "purchaseOrderId": "po-123",
    "supplierId": "sup-123",
    "totalValue": 150.00,
    "itemsReceived": 3
  }
}
```