# Order Management Workflow Specifications

## Overview

This document defines comprehensive order management workflows, state machines, routing logic, and business processes for the Restaurant Ordering System. The specifications cover the complete order lifecycle from placement to completion, including multi-counter routing and real-time status updates.

## 1. Order State Machine

### 1.1 Order Status States

```typescript
enum OrderStatus {
  // Initial states
  DRAFT = 'draft',                    // Order being created
  PENDING = 'pending',                // Order placed, awaiting payment

  // Payment states
  PAYMENT_PROCESSING = 'payment_processing',
  PAID = 'paid',                      // Payment confirmed
  PAYMENT_FAILED = 'payment_failed',  // Payment declined/failed

  // Processing states
  CONFIRMED = 'confirmed',            // Order confirmed by cafe
  ASSIGNED = 'assigned',              // Assigned to counter(s)
  PREPARING = 'preparing',            // Being prepared
  READY = 'ready',                    // Ready for pickup/service

  // Completion states
  COMPLETED = 'completed',            // Order fulfilled
  CANCELLED = 'cancelled',            // Order cancelled
  REFUNDED = 'refunded',              // Order refunded

  // Special states
  ON_HOLD = 'on_hold',               // Temporarily paused
  DELAYED = 'delayed'                 // Expected delay communicated
}

interface OrderStatusTransition {
  from: OrderStatus;
  to: OrderStatus;
  conditions?: string[];              // Business logic conditions
  requiredRoles: string[];            // Who can perform this transition
  automated: boolean;                 // Can be automated
  notifyCustomer: boolean;           // Send customer notification
  notifyStaff: boolean;              // Send staff notification
  webhooks: string[];                // External webhooks to call
}
```

### 1.2 Valid State Transitions

```typescript
const orderStateTransitions: OrderStatusTransition[] = [
  // Initial flow
  {
    from: OrderStatus.DRAFT,
    to: OrderStatus.PENDING,
    requiredRoles: ['customer', 'employee'],
    automated: false,
    notifyCustomer: true,
    notifyStaff: true,
    webhooks: ['order.placed']
  },

  // Payment flow
  {
    from: OrderStatus.PENDING,
    to: OrderStatus.PAYMENT_PROCESSING,
    conditions: ['payment_method_selected'],
    requiredRoles: ['system', 'customer'],
    automated: true,
    notifyCustomer: true,
    notifyStaff: false,
    webhooks: ['payment.started']
  },
  {
    from: OrderStatus.PAYMENT_PROCESSING,
    to: OrderStatus.PAID,
    conditions: ['payment_successful'],
    requiredRoles: ['system', 'payment_gateway'],
    automated: true,
    notifyCustomer: true,
    notifyStaff: true,
    webhooks: ['payment.completed', 'order.paid']
  },
  {
    from: OrderStatus.PAYMENT_PROCESSING,
    to: OrderStatus.PAYMENT_FAILED,
    conditions: ['payment_declined', 'payment_timeout'],
    requiredRoles: ['system', 'payment_gateway'],
    automated: true,
    notifyCustomer: true,
    notifyStaff: true,
    webhooks: ['payment.failed']
  },

  // Order processing
  {
    from: OrderStatus.PAID,
    to: OrderStatus.CONFIRMED,
    conditions: ['cafe_accepting_orders', 'items_available'],
    requiredRoles: ['manager', 'system'],
    automated: true,
    notifyCustomer: true,
    notifyStaff: true,
    webhooks: ['order.confirmed']
  },
  {
    from: OrderStatus.CONFIRMED,
    to: OrderStatus.ASSIGNED,
    conditions: ['counter_available'],
    requiredRoles: ['system', 'manager'],
    automated: true,
    notifyCustomer: false,
    notifyStaff: true,
    webhooks: ['order.assigned']
  },
  {
    from: OrderStatus.ASSIGNED,
    to: OrderStatus.PREPARING,
    conditions: ['employee_available'],
    requiredRoles: ['employee', 'barista', 'cook'],
    automated: false,
    notifyCustomer: true,
    notifyStaff: false,
    webhooks: ['order.preparation_started']
  },
  {
    from: OrderStatus.PREPARING,
    to: OrderStatus.READY,
    requiredRoles: ['employee', 'barista', 'cook'],
    automated: false,
    notifyCustomer: true,
    notifyStaff: true,
    webhooks: ['order.ready']
  },
  {
    from: OrderStatus.READY,
    to: OrderStatus.COMPLETED,
    conditions: ['order_picked_up', 'payment_completed'],
    requiredRoles: ['employee', 'customer'],
    automated: false,
    notifyCustomer: true,
    notifyStaff: false,
    webhooks: ['order.completed']
  },

  // Cancellation flows
  {
    from: OrderStatus.PENDING,
    to: OrderStatus.CANCELLED,
    conditions: ['within_cancellation_window'],
    requiredRoles: ['customer', 'manager'],
    automated: false,
    notifyCustomer: true,
    notifyStaff: true,
    webhooks: ['order.cancelled']
  },
  {
    from: OrderStatus.PAYMENT_FAILED,
    to: OrderStatus.CANCELLED,
    conditions: ['max_payment_retries_exceeded'],
    requiredRoles: ['system'],
    automated: true,
    notifyCustomer: true,
    notifyStaff: true,
    webhooks: ['order.auto_cancelled']
  },

  // Exception handling
  {
    from: OrderStatus.PREPARING,
    to: OrderStatus.ON_HOLD,
    conditions: ['equipment_failure', 'ingredient_shortage'],
    requiredRoles: ['employee', 'manager'],
    automated: false,
    notifyCustomer: true,
    notifyStaff: true,
    webhooks: ['order.on_hold']
  },
  {
    from: OrderStatus.ON_HOLD,
    to: OrderStatus.PREPARING,
    conditions: ['issue_resolved'],
    requiredRoles: ['employee', 'manager'],
    automated: false,
    notifyCustomer: true,
    notifyStaff: true,
    webhooks: ['order.resumed']
  },
  {
    from: OrderStatus.READY,
    to: OrderStatus.DELAYED,
    conditions: ['pickup_overdue'],
    requiredRoles: ['system'],
    automated: true,
    notifyCustomer: true,
    notifyStaff: true,
    webhooks: ['order.pickup_reminder']
  }
];
```

## 2. Counter Assignment & Routing Logic

### 2.1 Counter Configuration

```typescript
interface Counter {
  id: string;
  name: string;
  cafeId: string;
  type: CounterType;
  capabilities: CounterCapability[];
  status: CounterStatus;
  capacity: {
    maxConcurrentOrders: number;
    currentOrderCount: number;
    averageProcessingTime: number;    // minutes
  };
  staff: {
    assignedEmployees: string[];      // Employee IDs
    currentStaff: string[];           // Currently working
    requiredStaffCount: number;
  };
  equipment: {
    available: EquipmentType[];
    maintenance: MaintenanceSchedule[];
  };
  operatingHours: OperatingHours;
  priority: number;                   // Routing priority (1-10)
}

enum CounterType {
  ESPRESSO_BAR = 'espresso_bar',
  COLD_DRINKS = 'cold_drinks',
  FOOD_PREP = 'food_prep',
  PASTRY = 'pastry',
  CASHIER = 'cashier',
  GENERAL = 'general'
}

enum CounterCapability {
  HOT_DRINKS = 'hot_drinks',
  COLD_DRINKS = 'cold_drinks',
  FOOD = 'food',
  PASTRY = 'pastry',
  SANDWICHES = 'sandwiches',
  SALADS = 'salads',
  DESSERTS = 'desserts'
}

enum CounterStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  CLEANING = 'cleaning',
  BREAK = 'break'
}
```

### 2.2 Order Routing Algorithm

```typescript
interface OrderRoutingRequest {
  orderId: string;
  cafeId: string;
  items: OrderItem[];
  priority: OrderPriority;
  customerType: 'regular' | 'vip' | 'employee';
  estimatedPrepTime: number;
  specialRequirements: string[];
}

interface OrderRoutingResult {
  assignments: CounterAssignment[];
  estimatedCompletionTime: Date;
  totalPrepTime: number;
  confidence: number;                 // 0-1 routing confidence score
}

interface CounterAssignment {
  counterId: string;
  items: string[];                   // Item IDs assigned to this counter
  estimatedStartTime: Date;
  estimatedCompletionTime: Date;
  priority: number;
}

class OrderRoutingEngine {
  async routeOrder(request: OrderRoutingRequest): Promise<OrderRoutingResult> {
    // Step 1: Get available counters
    const availableCounters = await this.getAvailableCounters(request.cafeId);

    // Step 2: Group items by required capabilities
    const itemGroups = this.groupItemsByCapability(request.items);

    // Step 3: Find optimal counter assignments
    const assignments = await this.findOptimalAssignments(
      itemGroups,
      availableCounters,
      request
    );

    // Step 4: Calculate timing and confidence
    const timing = this.calculateTiming(assignments);
    const confidence = this.calculateConfidence(assignments, availableCounters);

    return {
      assignments,
      estimatedCompletionTime: timing.completionTime,
      totalPrepTime: timing.totalTime,
      confidence
    };
  }

  private async getAvailableCounters(cafeId: string): Promise<Counter[]> {
    const allCounters = await this.counterRepository.findByCafe(cafeId);

    return allCounters.filter(counter =>
      counter.status === CounterStatus.ACTIVE &&
      this.isWithinOperatingHours(counter) &&
      this.hasAvailableCapacity(counter) &&
      this.hasRequiredStaff(counter)
    );
  }

  private groupItemsByCapability(items: OrderItem[]): Map<CounterCapability, OrderItem[]> {
    const groups = new Map<CounterCapability, OrderItem[]>();

    for (const item of items) {
      const capabilities = this.getRequiredCapabilities(item);

      for (const capability of capabilities) {
        if (!groups.has(capability)) {
          groups.set(capability, []);
        }
        groups.get(capability)!.push(item);
      }
    }

    return groups;
  }

  private async findOptimalAssignments(
    itemGroups: Map<CounterCapability, OrderItem[]>,
    availableCounters: Counter[],
    request: OrderRoutingRequest
  ): Promise<CounterAssignment[]> {
    const assignments: CounterAssignment[] = [];

    // Priority-based assignment algorithm
    for (const [capability, items] of itemGroups) {
      const eligibleCounters = availableCounters.filter(counter =>
        counter.capabilities.includes(capability)
      );

      if (eligibleCounters.length === 0) {
        throw new Error(`No available counter for capability: ${capability}`);
      }

      // Score counters based on multiple factors
      const scoredCounters = this.scoreCounters(
        eligibleCounters,
        items,
        request
      );

      // Assign to best available counter
      const bestCounter = scoredCounters[0];
      const assignment = await this.createAssignment(
        bestCounter.counter,
        items,
        request
      );

      assignments.push(assignment);

      // Update counter capacity
      bestCounter.counter.capacity.currentOrderCount += 1;
    }

    return this.optimizeAssignments(assignments);
  }

  private scoreCounters(
    counters: Counter[],
    items: OrderItem[],
    request: OrderRoutingRequest
  ): Array<{ counter: Counter; score: number }> {
    return counters.map(counter => ({
      counter,
      score: this.calculateCounterScore(counter, items, request)
    })).sort((a, b) => b.score - a.score);
  }

  private calculateCounterScore(
    counter: Counter,
    items: OrderItem[],
    request: OrderRoutingRequest
  ): number {
    let score = 0;

    // Factor 1: Current load (lower is better)
    const loadFactor = 1 - (counter.capacity.currentOrderCount / counter.capacity.maxConcurrentOrders);
    score += loadFactor * 40;

    // Factor 2: Staff availability
    const staffFactor = counter.staff.currentStaff.length / counter.staff.requiredStaffCount;
    score += Math.min(staffFactor, 1) * 30;

    // Factor 3: Average processing time (faster is better)
    const timeFactor = Math.max(0, 1 - (counter.capacity.averageProcessingTime / 30));
    score += timeFactor * 20;

    // Factor 4: Priority setting
    score += (counter.priority / 10) * 10;

    // Factor 5: Customer type priority
    if (request.customerType === 'vip') {
      score += 10;
    } else if (request.customerType === 'employee') {
      score += 5;
    }

    return score;
  }

  private async createAssignment(
    counter: Counter,
    items: OrderItem[],
    request: OrderRoutingRequest
  ): Promise<CounterAssignment> {
    const currentTime = new Date();
    const queueTime = this.calculateQueueTime(counter);
    const prepTime = this.calculatePrepTime(items);

    return {
      counterId: counter.id,
      items: items.map(item => item.id),
      estimatedStartTime: new Date(currentTime.getTime() + queueTime * 60000),
      estimatedCompletionTime: new Date(currentTime.getTime() + (queueTime + prepTime) * 60000),
      priority: this.calculateItemPriority(items, request)
    };
  }

  private optimizeAssignments(assignments: CounterAssignment[]): CounterAssignment[] {
    // Apply optimization algorithms to minimize total completion time
    // and balance workload across counters

    return assignments.sort((a, b) =>
      a.estimatedCompletionTime.getTime() - b.estimatedCompletionTime.getTime()
    );
  }
}
```

### 2.3 Dynamic Routing Adjustments

```typescript
class DynamicRoutingManager {
  private routingEngine: OrderRoutingEngine;
  private eventBus: EventBus;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Counter status changes
    this.eventBus.on('counter.status_changed', this.handleCounterStatusChange.bind(this));

    // Staff changes
    this.eventBus.on('employee.clocked_in', this.handleStaffChange.bind(this));
    this.eventBus.on('employee.clocked_out', this.handleStaffChange.bind(this));

    // Equipment issues
    this.eventBus.on('equipment.failure', this.handleEquipmentFailure.bind(this));

    // Order completion updates
    this.eventBus.on('order.completed', this.handleOrderCompletion.bind(this));
  }

  async handleCounterStatusChange(event: CounterStatusChangeEvent) {
    if (event.newStatus === CounterStatus.INACTIVE ||
        event.newStatus === CounterStatus.MAINTENANCE) {

      // Reassign pending orders from this counter
      await this.reassignOrdersFromCounter(event.counterId);
    }

    // Recalculate routing for pending orders
    await this.recalculateRoutingForPendingOrders(event.cafeId);
  }

  private async reassignOrdersFromCounter(counterId: string) {
    const pendingOrders = await this.orderRepository.findPendingByCounter(counterId);

    for (const order of pendingOrders) {
      try {
        const newRouting = await this.routingEngine.routeOrder({
          orderId: order.id,
          cafeId: order.cafeId,
          items: order.items,
          priority: order.priority,
          customerType: order.customerType,
          estimatedPrepTime: order.estimatedPrepTime,
          specialRequirements: order.specialRequirements
        });

        await this.updateOrderRouting(order.id, newRouting);

        // Notify customer of potential delay
        await this.notificationService.notifyCustomer(order.customerId, {
          type: 'order_reassigned',
          message: 'Your order has been reassigned to ensure quality preparation',
          estimatedDelay: this.calculateDelay(order.originalEstimate, newRouting.estimatedCompletionTime)
        });

      } catch (error) {
        console.error(`Failed to reassign order ${order.id}:`, error);

        // Fallback: assign to default counter or put on hold
        await this.handleRoutingFailure(order);
      }
    }
  }

  private async handleOrderCompletion(event: OrderCompletionEvent) {
    // Update counter capacity and performance metrics
    await this.updateCounterMetrics(event.counterId, event.actualCompletionTime);

    // Trigger next order in queue
    await this.processNextQueuedOrder(event.counterId);
  }

  private async handleEquipmentFailure(event: EquipmentFailureEvent) {
    // Find counters affected by equipment failure
    const affectedCounters = await this.getCountersByEquipment(event.equipmentType);

    for (const counter of affectedCounters) {
      // Update counter capabilities
      await this.updateCounterCapabilities(counter.id, event.equipmentType, false);

      // Reassign orders requiring this equipment
      await this.reassignOrdersRequiringEquipment(counter.id, event.equipmentType);
    }
  }
}
```

## 3. Order Workflow Management

### 3.1 Workflow Orchestration

```typescript
interface OrderWorkflow {
  id: string;
  orderId: string;
  cafeId: string;
  steps: WorkflowStep[];
  currentStepIndex: number;
  status: 'active' | 'paused' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  context: WorkflowContext;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  assignedTo?: string;           // Employee ID or system
  estimatedDuration: number;     // minutes
  actualDuration?: number;
  dependencies: string[];        // Step IDs this step depends on
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

enum WorkflowStepType {
  PAYMENT_VERIFICATION = 'payment_verification',
  INVENTORY_CHECK = 'inventory_check',
  ORDER_CONFIRMATION = 'order_confirmation',
  COUNTER_ASSIGNMENT = 'counter_assignment',
  PREPARATION = 'preparation',
  QUALITY_CHECK = 'quality_check',
  PACKAGING = 'packaging',
  NOTIFICATION = 'notification',
  COMPLETION = 'completion'
}

class OrderWorkflowEngine {
  async createWorkflow(order: Order): Promise<OrderWorkflow> {
    const steps = await this.generateWorkflowSteps(order);

    const workflow: OrderWorkflow = {
      id: generateId(),
      orderId: order.id,
      cafeId: order.cafeId,
      steps,
      currentStepIndex: 0,
      status: 'active',
      startedAt: new Date(),
      context: {
        orderType: order.orderType,
        customerType: order.customerType,
        totalAmount: order.total,
        itemCount: order.items.length,
        specialRequirements: order.specialRequirements
      }
    };

    await this.workflowRepository.save(workflow);
    await this.executeNextStep(workflow);

    return workflow;
  }

  private async generateWorkflowSteps(order: Order): Promise<WorkflowStep[]> {
    const steps: WorkflowStep[] = [];

    // Step 1: Payment verification
    if (order.paymentStatus === 'pending') {
      steps.push({
        id: generateId(),
        name: 'Payment Verification',
        type: WorkflowStepType.PAYMENT_VERIFICATION,
        status: 'pending',
        assignedTo: 'system',
        estimatedDuration: 1,
        dependencies: [],
        conditions: [
          { type: 'payment_method_selected', value: true },
          { type: 'payment_amount_valid', value: true }
        ],
        actions: [
          { type: 'verify_payment', parameters: { orderId: order.id } },
          { type: 'update_order_status', parameters: { status: 'payment_processing' } }
        ]
      });
    }

    // Step 2: Inventory check
    steps.push({
      id: generateId(),
      name: 'Inventory Check',
      type: WorkflowStepType.INVENTORY_CHECK,
      status: 'pending',
      assignedTo: 'system',
      estimatedDuration: 0.5,
      dependencies: order.paymentStatus === 'pending' ? [steps[0].id] : [],
      conditions: [
        { type: 'items_in_stock', value: true }
      ],
      actions: [
        { type: 'check_inventory', parameters: { items: order.items } },
        { type: 'reserve_ingredients', parameters: { items: order.items } }
      ]
    });

    // Step 3: Order confirmation
    steps.push({
      id: generateId(),
      name: 'Order Confirmation',
      type: WorkflowStepType.ORDER_CONFIRMATION,
      status: 'pending',
      assignedTo: 'system',
      estimatedDuration: 0.5,
      dependencies: [steps[steps.length - 1].id],
      conditions: [
        { type: 'cafe_accepting_orders', value: true }
      ],
      actions: [
        { type: 'confirm_order', parameters: { orderId: order.id } },
        { type: 'notify_customer', parameters: { type: 'order_confirmed' } }
      ]
    });

    // Step 4: Counter assignment
    steps.push({
      id: generateId(),
      name: 'Counter Assignment',
      type: WorkflowStepType.COUNTER_ASSIGNMENT,
      status: 'pending',
      assignedTo: 'system',
      estimatedDuration: 0.5,
      dependencies: [steps[steps.length - 1].id],
      conditions: [
        { type: 'counter_available', value: true }
      ],
      actions: [
        { type: 'assign_to_counter', parameters: { orderId: order.id } },
        { type: 'notify_staff', parameters: { type: 'new_order' } }
      ]
    });

    // Step 5: Preparation (multiple parallel steps for different items)
    const preparationSteps = this.createPreparationSteps(order);
    steps.push(...preparationSteps);

    // Step 6: Quality check (if enabled for cafe)
    const cafeSettings = await this.getCafeSettings(order.cafeId);
    if (cafeSettings.qualityCheckEnabled) {
      steps.push({
        id: generateId(),
        name: 'Quality Check',
        type: WorkflowStepType.QUALITY_CHECK,
        status: 'pending',
        assignedTo: 'manager',
        estimatedDuration: 2,
        dependencies: preparationSteps.map(step => step.id),
        conditions: [],
        actions: [
          { type: 'perform_quality_check', parameters: { orderId: order.id } }
        ]
      });
    }

    // Step 7: Packaging (for takeaway/delivery)
    if (order.orderType !== 'dine-in') {
      steps.push({
        id: generateId(),
        name: 'Packaging',
        type: WorkflowStepType.PACKAGING,
        status: 'pending',
        estimatedDuration: 2,
        dependencies: cafeSettings.qualityCheckEnabled ?
          [steps[steps.length - 1].id] :
          preparationSteps.map(step => step.id),
        conditions: [],
        actions: [
          { type: 'package_order', parameters: { orderId: order.id, orderType: order.orderType } }
        ]
      });
    }

    // Step 8: Customer notification
    steps.push({
      id: generateId(),
      name: 'Ready Notification',
      type: WorkflowStepType.NOTIFICATION,
      status: 'pending',
      assignedTo: 'system',
      estimatedDuration: 0.1,
      dependencies: [steps[steps.length - 1].id],
      conditions: [],
      actions: [
        { type: 'notify_customer', parameters: { type: 'order_ready' } },
        { type: 'update_order_status', parameters: { status: 'ready' } }
      ]
    });

    // Step 9: Order completion
    steps.push({
      id: generateId(),
      name: 'Order Completion',
      type: WorkflowStepType.COMPLETION,
      status: 'pending',
      assignedTo: 'employee',
      estimatedDuration: 1,
      dependencies: [steps[steps.length - 1].id],
      conditions: [
        { type: 'customer_confirmed_pickup', value: true }
      ],
      actions: [
        { type: 'complete_order', parameters: { orderId: order.id } },
        { type: 'release_table', parameters: { tableNumber: order.tableNumber } },
        { type: 'update_metrics', parameters: { orderId: order.id } }
      ]
    });

    return steps;
  }

  private createPreparationSteps(order: Order): WorkflowStep[] {
    const preparationSteps: WorkflowStep[] = [];
    const itemsByCounter = this.groupItemsByCounter(order.items);

    for (const [counterId, items] of itemsByCounter) {
      const estimatedTime = this.calculatePreparationTime(items);

      preparationSteps.push({
        id: generateId(),
        name: `Preparation - Counter ${counterId}`,
        type: WorkflowStepType.PREPARATION,
        status: 'pending',
        assignedTo: this.getCounterStaff(counterId),
        estimatedDuration: estimatedTime,
        dependencies: [], // Will be set based on counter assignment step
        conditions: [
          { type: 'staff_available', value: true },
          { type: 'equipment_operational', value: true }
        ],
        actions: [
          { type: 'start_preparation', parameters: { items: items.map(i => i.id) } },
          { type: 'track_preparation_time', parameters: { counterId } }
        ]
      });
    }

    return preparationSteps;
  }

  async executeNextStep(workflow: OrderWorkflow): Promise<void> {
    const currentStep = workflow.steps[workflow.currentStepIndex];

    if (!currentStep || workflow.status !== 'active') {
      return;
    }

    try {
      // Check if all dependencies are completed
      const dependenciesCompleted = await this.checkDependencies(
        currentStep.dependencies,
        workflow
      );

      if (!dependenciesCompleted) {
        // Wait for dependencies
        setTimeout(() => this.executeNextStep(workflow), 5000);
        return;
      }

      // Check conditions
      const conditionsMet = await this.checkConditions(
        currentStep.conditions,
        workflow
      );

      if (!conditionsMet) {
        // Handle condition failure
        await this.handleStepConditionFailure(workflow, currentStep);
        return;
      }

      // Execute step
      currentStep.status = 'in_progress';
      currentStep.startedAt = new Date();

      await this.executeStepActions(currentStep, workflow);

      // Mark step as completed
      currentStep.status = 'completed';
      currentStep.completedAt = new Date();
      currentStep.actualDuration =
        (currentStep.completedAt.getTime() - currentStep.startedAt!.getTime()) / 60000;

      // Move to next step
      workflow.currentStepIndex++;

      if (workflow.currentStepIndex >= workflow.steps.length) {
        // Workflow completed
        workflow.status = 'completed';
        workflow.completedAt = new Date();
      } else {
        // Execute next step
        await this.executeNextStep(workflow);
      }

      await this.workflowRepository.update(workflow);

    } catch (error) {
      await this.handleStepError(workflow, currentStep, error);
    }
  }

  private async executeStepActions(
    step: WorkflowStep,
    workflow: OrderWorkflow
  ): Promise<void> {
    for (const action of step.actions) {
      await this.executeAction(action, workflow.context);
    }
  }

  private async handleStepError(
    workflow: OrderWorkflow,
    step: WorkflowStep,
    error: Error
  ): Promise<void> {
    step.status = 'failed';
    step.error = error.message;
    step.completedAt = new Date();

    // Determine if workflow should be paused or failed
    if (this.isCriticalStep(step)) {
      workflow.status = 'failed';

      // Notify relevant parties
      await this.notificationService.notifyOrderFailure(
        workflow.orderId,
        step.name,
        error.message
      );
    } else {
      // Try to recover or skip step
      await this.attemptStepRecovery(workflow, step);
    }

    await this.workflowRepository.update(workflow);
  }
}
```

## 4. Queue Management

### 4.1 Priority Queue System

```typescript
interface OrderQueue {
  counterId: string;
  orders: QueuedOrder[];
  maxSize: number;
  processingRate: number;        // Orders per hour
  averageWaitTime: number;       // Minutes
}

interface QueuedOrder {
  orderId: string;
  priority: number;              // 1-10 (10 highest)
  queuedAt: Date;
  estimatedStartTime: Date;
  customerType: 'regular' | 'vip' | 'employee';
  specialRequirements: string[];
}

class QueueManager {
  private queues = new Map<string, OrderQueue>();

  async addToQueue(
    counterId: string,
    orderId: string,
    priority: number,
    customerType: 'regular' | 'vip' | 'employee'
  ): Promise<QueuePosition> {
    const queue = await this.getOrCreateQueue(counterId);

    const queuedOrder: QueuedOrder = {
      orderId,
      priority: this.calculateFinalPriority(priority, customerType),
      queuedAt: new Date(),
      estimatedStartTime: this.calculateEstimatedStartTime(queue),
      customerType,
      specialRequirements: []
    };

    // Insert order based on priority
    const insertIndex = this.findInsertPosition(queue.orders, queuedOrder.priority);
    queue.orders.splice(insertIndex, 0, queuedOrder);

    // Update estimated times for all orders
    this.updateEstimatedTimes(queue);

    await this.saveQueue(queue);

    return {
      position: insertIndex + 1,
      estimatedStartTime: queuedOrder.estimatedStartTime,
      estimatedWaitTime: this.calculateWaitTime(queuedOrder.estimatedStartTime)
    };
  }

  private calculateFinalPriority(
    basePriority: number,
    customerType: 'regular' | 'vip' | 'employee'
  ): number {
    let finalPriority = basePriority;

    // Customer type modifiers
    switch (customerType) {
      case 'vip':
        finalPriority += 3;
        break;
      case 'employee':
        finalPriority += 1;
        break;
    }

    // Time-based adjustments (rush hour priority)
    const currentHour = new Date().getHours();
    if ((currentHour >= 8 && currentHour <= 10) || // Morning rush
        (currentHour >= 12 && currentHour <= 14)) { // Lunch rush
      finalPriority += 1;
    }

    return Math.min(finalPriority, 10);
  }

  async processNext(counterId: string): Promise<string | null> {
    const queue = await this.getQueue(counterId);
    if (!queue || queue.orders.length === 0) {
      return null;
    }

    const nextOrder = queue.orders.shift()!;

    // Update processing metrics
    const actualWaitTime = (Date.now() - nextOrder.queuedAt.getTime()) / 60000;
    this.updateWaitTimeMetrics(counterId, actualWaitTime);

    // Update estimated times for remaining orders
    this.updateEstimatedTimes(queue);

    await this.saveQueue(queue);

    return nextOrder.orderId;
  }

  async getQueueStatus(counterId: string): Promise<QueueStatus> {
    const queue = await this.getQueue(counterId);
    if (!queue) {
      return { length: 0, estimatedWaitTime: 0, isActive: false };
    }

    return {
      length: queue.orders.length,
      estimatedWaitTime: queue.averageWaitTime,
      isActive: queue.orders.length > 0,
      nextOrderEstimate: queue.orders[0]?.estimatedStartTime
    };
  }
}
```

This comprehensive order management workflow specification ensures efficient order processing, optimal counter utilization, and excellent customer experience through intelligent routing and queue management.