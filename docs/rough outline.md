---
title: "Food and Drink Ordering App - Design Document"
---

# Food and Drink Ordering App - Design Document

## Overview

This ordering app is designed for cafés and restaurants, providing two distinct views:

1. **Waiter View** - Allows waitstaff to manage orders, view table assignments, and update order statuses.
2. **Customer View** - Enables customers to browse the menu, place orders, and request assistance.

## Features

### Common Features:

- User authentication (email/password, social login, or QR-based access for customers).
- Multi-language support.
- Order history tracking.
- Real-time notifications.

### Waiter View:

- Assign and manage tables.
- View and manage active orders.
- Modify and cancel orders.
- Update order statuses (e.g., Preparing, Ready, Served).
- Track bill for each table.
- Receive special requests from customers.
- View and manage printing locations for orders.

### Customer View:

- Browse categorized menu items with images and descriptions.
- Add items to the cart and place an order.
- Request modifications to orders.
- View order status in real-time.
- Call the waiter for assistance.
- Split the bill and make payments.

## Database Model (TypeORM)

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Field, ObjectType, ID } from "@nestjs/graphql";

@ObjectType()
@Entity()
export class User {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column({ unique: true })
    email: string;

    @Field()
    @Column()
    password: string;

    @Field()
    @Column({ type: "enum", enum: ["WAITER", "CUSTOMER"] })
    role: "WAITER" | "CUSTOMER";
}

@ObjectType()
@Entity()
export class PrintingLocation {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    label: string;
}

@ObjectType()
@Entity()
export class Table {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    number: string;

    @Field(() => [Order])
    @OneToMany(() => Order, order => order.table)
    orders: Order[];

    @Field(() => PrintingLocation, { nullable: true })
    @ManyToOne(() => PrintingLocation, { nullable: true })
    printingLocation: PrintingLocation;
}

@ObjectType()
@Entity()
export class MenuItem {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column()
    description: string;

    @Field()
    @Column("decimal")
    price: number;

    @Field()
    @Column()
    category: string;

    @Field(() => PrintingLocation)
    @ManyToOne(() => PrintingLocation)
    printingLocation: PrintingLocation;
}

@ObjectType()
@Entity()
export class Order {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(() => Table)
    @ManyToOne(() => Table, table => table.orders)
    table: Table;

    @Field(() => User)
    @ManyToOne(() => User)
    waiter: User;

    @Field()
    @Column({ type: "enum", enum: ["PENDING", "PREPARING", "READY", "SERVED"] })
    status: "PENDING" | "PREPARING" | "READY" | "SERVED";

    @Field(() => [OrderItem])
    @OneToMany(() => OrderItem, orderItem => orderItem.order)
    items: OrderItem[];

    @Field()
    @CreateDateColumn()
    createdAt: Date;
}

@ObjectType()
@Entity()
export class OrderItem {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(() => Order)
    @ManyToOne(() => Order, order => order.items)
    order: Order;

    @Field(() => MenuItem)
    @ManyToOne(() => MenuItem)
    menuItem: MenuItem;

    @Field()
    @Column()
    quantity: number;
}
```

## Technology Stack

- **Frontend:** Angular, React Native (for mobile app)
- **Backend:** NestJS with GraphQL
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT-based authentication
- **Deployment:** Docker & Kubernetes
- **Real-time updates:** WebSockets or GraphQL Subscriptions

## Conclusion

This design document outlines a structured approach to building an efficient and scalable food ordering system, ensuring smooth operations for both customers and waitstaff. It includes support for dedicated printing locations for specific menu items and table-level configuration using label-based assignment to streamline order processing.

