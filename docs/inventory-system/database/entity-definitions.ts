// Inventory Management System - TypeORM Entity Definitions
// These entities extend the existing table-tap restaurant system

import { SortableField } from '@app/utils';
import { Field, ID, ObjectType, Int, Float, registerEnumType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  Unique,
} from 'typeorm';

// ================================
// ENUMS
// ================================

export enum MovementType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
  WASTE = 'waste',
  RETURN = 'return',
}

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  CONFIRMED = 'confirmed',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  COMPANY_ACCOUNT = 'company_account',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum GlassStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  DIRTY = 'dirty',
  BROKEN = 'broken',
  LOST = 'lost',
  RETIRED = 'retired',
}

export enum GlassTransactionType {
  CHECKOUT = 'checkout',
  CHECKIN = 'checkin',
  CLEAN = 'clean',
  BREAK = 'break',
  LOSE = 'lose',
  FIND = 'find',
}

// Register enums with GraphQL
registerEnumType(MovementType, { name: 'MovementType' });
registerEnumType(PurchaseOrderStatus, { name: 'PurchaseOrderStatus' });
registerEnumType(PaymentMethod, { name: 'PaymentMethod' });
registerEnumType(PaymentStatus, { name: 'PaymentStatus' });
registerEnumType(AlertSeverity, { name: 'AlertSeverity' });
registerEnumType(AlertStatus, { name: 'AlertStatus' });
registerEnumType(GlassStatus, { name: 'GlassStatus' });
registerEnumType(GlassTransactionType, { name: 'GlassTransactionType' });

// ================================
// INVENTORY CORE ENTITIES
// ================================

@ObjectType('InventoryCategory')
@Entity('inventory_categories')
@Index(['cafeId', 'name'])
@Unique(['name', 'cafeId'])
export class InventoryCategory extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @SortableField()
  @Column()
  @Index({ fulltext: true })
  declare name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare description: string;

  @Field(() => Int, { defaultValue: 0 })
  @Column({ default: 0 })
  declare sortOrder: number;

  @Field({ defaultValue: true })
  @Column({ default: true })
  declare isActive: boolean;

  @SortableField()
  @Column()
  @Index()
  declare cafeId: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index()
  declare parentId: string;

  // Relations
  @Field(() => Cafe)
  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;

  @Field(() => InventoryCategory, { nullable: true })
  @ManyToOne(() => InventoryCategory, (category) => category.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  declare parent: InventoryCategory;

  @Field(() => [InventoryCategory], { nullable: true })
  @OneToMany(() => InventoryCategory, (category) => category.parent)
  declare children: InventoryCategory[];

  @Field(() => [InventoryProduct], { nullable: true })
  @OneToMany(() => InventoryProduct, (product) => product.category)
  declare products: InventoryProduct[];
}

@ObjectType('StorageLocation')
@Entity('storage_locations')
@Index(['cafeId', 'type'])
@Unique(['name', 'cafeId'])
export class StorageLocation extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @SortableField()
  @Column()
  declare name: string;

  @Field()
  @Column()
  declare type: string; // 'refrigerator', 'freezer', 'pantry', 'bar', 'storage_room'

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare description: string;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  declare temperatureMin: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  declare temperatureMax: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare capacityVolume: number; // Liters

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare capacityWeight: number; // Kilograms

  @Field({ defaultValue: true })
  @Column({ default: true })
  declare isActive: boolean;

  @SortableField()
  @Column()
  @Index()
  declare cafeId: string;

  // Relations
  @Field(() => Cafe)
  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;

  @Field(() => [InventoryStock], { nullable: true })
  @OneToMany(() => InventoryStock, (stock) => stock.location)
  declare stockItems: InventoryStock[];
}

@ObjectType('InventoryProduct')
@Entity('inventory_products')
@Index(['cafeId', 'categoryId'])
@Index(['reorderPoint', 'isActive'])
export class InventoryProduct extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @SortableField()
  @Column()
  @Index({ fulltext: true })
  declare name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @Index({ fulltext: true })
  declare description: string;

  @Field()
  @Column({ unique: true })
  declare sku: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare barcode: string;

  @Field()
  @Column()
  declare unitOfMeasurement: string; // 'kg', 'l', 'pieces', 'bottles'

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 4 })
  declare unitCost: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 4, nullable: true })
  declare supplierCost: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare storageRequirements: string;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  declare shelfLifeDays: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare minStockLevel: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare maxStockLevel: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  @Index()
  declare reorderPoint: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  declare reorderQuantity: number;

  @Field({ defaultValue: true })
  @Column({ default: true })
  declare isActive: boolean;

  @SortableField()
  @Column()
  @Index()
  declare cafeId: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index()
  declare categoryId: string;

  // Relations
  @Field(() => Cafe)
  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;

  @Field(() => InventoryCategory, { nullable: true })
  @ManyToOne(() => InventoryCategory, (category) => category.products, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  declare category: InventoryCategory;

  @Field(() => [InventoryStock], { nullable: true })
  @OneToMany(() => InventoryStock, (stock) => stock.product)
  declare stockLevels: InventoryStock[];

  @Field(() => [InventoryMovement], { nullable: true })
  @OneToMany(() => InventoryMovement, (movement) => movement.product)
  declare movements: InventoryMovement[];

  @Field(() => [SupplierProduct], { nullable: true })
  @OneToMany(() => SupplierProduct, (supplierProduct) => supplierProduct.product)
  declare supplierProducts: SupplierProduct[];
}

@ObjectType('InventoryStock')
@Entity('inventory_stock')
@Index(['productId', 'locationId'])
@Index(['quantity', 'reservedQuantity'])
@Unique(['productId', 'locationId', 'batchNumber'])
export class InventoryStock extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @Index()
  declare batchNumber: string;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare quantity: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare reservedQuantity: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 4 })
  declare costPerUnit: number;

  @SortableField({ nullable: true })
  @Column({ type: 'date', nullable: true })
  declare expirationDate: Date;

  @SortableField()
  @Column({ type: 'date' })
  declare receivedDate: Date;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare lastCountedAt: Date;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare lastCountedQuantity: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare notes: string;

  @SortableField()
  @Column()
  @Index()
  declare productId: string;

  @SortableField()
  @Column()
  @Index()
  declare locationId: string;

  // Relations
  @Field(() => InventoryProduct)
  @ManyToOne(() => InventoryProduct, (product) => product.stockLevels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  declare product: InventoryProduct;

  @Field(() => StorageLocation)
  @ManyToOne(() => StorageLocation, (location) => location.stockItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'locationId' })
  declare location: StorageLocation;
}

// ================================
// SUPPLIER MANAGEMENT ENTITIES
// ================================

@ObjectType('Supplier')
@Entity('suppliers')
@Index(['cafeId', 'isActive'])
export class Supplier extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @SortableField()
  @Column()
  declare name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare contactPerson: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare email: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare phone: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare address: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare paymentTerms: string; // 'NET_30', 'NET_15', 'COD', etc.

  @Field(() => Int)
  @Column({ default: 1 })
  declare leadTimeDays: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare minimumOrderAmount: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare deliveryFee: number;

  @Field(() => Float)
  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  declare rating: number; // 0-5 rating

  @Field({ defaultValue: true })
  @Column({ default: true })
  declare isActive: boolean;

  @SortableField()
  @Column()
  @Index()
  declare cafeId: string;

  // Relations
  @Field(() => Cafe)
  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;

  @Field(() => [SupplierProduct], { nullable: true })
  @OneToMany(() => SupplierProduct, (supplierProduct) => supplierProduct.supplier)
  declare products: SupplierProduct[];

  @Field(() => [PurchaseOrder], { nullable: true })
  @OneToMany(() => PurchaseOrder, (order) => order.supplier)
  declare purchaseOrders: PurchaseOrder[];
}

@ObjectType('SupplierProduct')
@Entity('supplier_products')
@Unique(['supplierId', 'productId'])
export class SupplierProduct extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare supplierSku: string;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 4 })
  declare unitCost: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 1 })
  declare minimumOrderQuantity: number;

  @Field(() => Int)
  @Column({ default: 1 })
  declare leadTimeDays: number;

  @Field({ defaultValue: false })
  @Column({ default: false })
  declare isPreferred: boolean;

  @SortableField()
  @Column()
  declare lastPriceUpdate: Date;

  @SortableField()
  @Column()
  @Index()
  declare supplierId: string;

  @SortableField()
  @Column()
  @Index()
  declare productId: string;

  // Relations
  @Field(() => Supplier)
  @ManyToOne(() => Supplier, (supplier) => supplier.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplierId' })
  declare supplier: Supplier;

  @Field(() => InventoryProduct)
  @ManyToOne(() => InventoryProduct, (product) => product.supplierProducts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  declare product: InventoryProduct;
}

// ================================
// PURCHASE MANAGEMENT ENTITIES
// ================================

@ObjectType('PurchaseOrder')
@Entity('purchase_orders')
@Index(['supplierId', 'status'])
@Index(['cafeId', 'orderDate'])
@Index(['status', 'paymentStatus'])
export class PurchaseOrder extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @Field()
  @Column({ unique: true })
  declare poNumber: string;

  @Field(() => PurchaseOrderStatus)
  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.DRAFT,
  })
  declare status: PurchaseOrderStatus;

  @SortableField()
  @Column({ type: 'date' })
  declare orderDate: Date;

  @SortableField({ nullable: true })
  @Column({ type: 'date', nullable: true })
  declare expectedDeliveryDate: Date;

  @SortableField({ nullable: true })
  @Column({ type: 'date', nullable: true })
  declare actualDeliveryDate: Date;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare subtotal: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare taxAmount: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare shippingCost: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare discountAmount: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare totalAmount: number;

  @Field(() => PaymentMethod, { nullable: true })
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  declare paymentMethod: PaymentMethod;

  @Field(() => PaymentStatus)
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  declare paymentStatus: PaymentStatus;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare notes: string;

  @SortableField()
  @Column()
  @Index()
  declare cafeId: string;

  @SortableField()
  @Column()
  @Index()
  declare supplierId: string;

  @SortableField()
  @Column()
  @Index()
  declare createdByUserId: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index()
  declare approvedByUserId: string;

  // Relations
  @Field(() => Cafe)
  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;

  @Field(() => Supplier)
  @ManyToOne(() => Supplier, (supplier) => supplier.purchaseOrders)
  @JoinColumn({ name: 'supplierId' })
  declare supplier: Supplier;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdByUserId' })
  declare createdByUser: User;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedByUserId' })
  declare approvedByUser: User;

  @Field(() => [PurchaseOrderItem])
  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, { cascade: true })
  declare items: PurchaseOrderItem[];

  @Field(() => [PurchaseReceipt], { nullable: true })
  @OneToMany(() => PurchaseReceipt, (receipt) => receipt.purchaseOrder)
  declare receipts: PurchaseReceipt[];
}

@ObjectType('PurchaseOrderItem')
@Entity('purchase_order_items')
@Index(['purchaseOrderId'])
export class PurchaseOrderItem extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  declare quantityOrdered: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare quantityReceived: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 4 })
  declare unitCost: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  declare totalCost: number;

  @SortableField({ nullable: true })
  @Column({ type: 'date', nullable: true })
  declare expirationDate: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare batchNumber: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare notes: string;

  @SortableField()
  @Column()
  @Index()
  declare purchaseOrderId: string;

  @SortableField()
  @Column()
  @Index()
  declare productId: string;

  // Relations
  @Field(() => PurchaseOrder)
  @ManyToOne(() => PurchaseOrder, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseOrderId' })
  declare purchaseOrder: PurchaseOrder;

  @Field(() => InventoryProduct)
  @ManyToOne(() => InventoryProduct)
  @JoinColumn({ name: 'productId' })
  declare product: InventoryProduct;
}

@ObjectType('PurchaseReceipt')
@Entity('purchase_receipts')
@Index(['purchaseOrderId'])
@Index(['cafeId', 'receiptDate'])
export class PurchaseReceipt extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare receiptNumber: string;

  @SortableField()
  @Column({ type: 'date' })
  declare receiptDate: Date;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  declare totalAmount: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare taxAmount: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare imageUrl: string;

  @Field({ nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  declare ocrData: any;

  @Field({ defaultValue: false })
  @Column({ default: false })
  declare isVerified: boolean;

  @SortableField()
  @Column()
  @Index()
  declare cafeId: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index()
  declare purchaseOrderId: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index()
  declare verifiedByUserId: string;

  // Relations
  @Field(() => Cafe)
  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;

  @Field(() => PurchaseOrder, { nullable: true })
  @ManyToOne(() => PurchaseOrder, (order) => order.receipts, { nullable: true })
  @JoinColumn({ name: 'purchaseOrderId' })
  declare purchaseOrder: PurchaseOrder;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verifiedByUserId' })
  declare verifiedByUser: User;
}

// ================================
// MOVEMENT AND ANALYTICS ENTITIES
// ================================

@ObjectType('InventoryMovement')
@Entity('inventory_movements')
@Index(['productId', 'createdAt'])
@Index(['locationId', 'createdAt'])
@Index(['movementType', 'createdAt'])
@Index(['referenceType', 'referenceId'])
@Index(['cafeId', 'createdAt'])
export class InventoryMovement extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @Field(() => MovementType)
  @Column({
    type: 'enum',
    enum: MovementType,
  })
  declare movementType: MovementType;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare referenceType: string; // 'purchase_order', 'order', 'adjustment', 'transfer'

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare referenceId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare batchNumber: string;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  declare quantityChange: number; // Positive for additions, negative for removals

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  declare quantityBefore: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  declare quantityAfter: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 4 })
  declare unitCost: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  declare totalCost: number;

  @SortableField({ nullable: true })
  @Column({ type: 'date', nullable: true })
  declare expirationDate: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare reason: string;

  @SortableField()
  @Column()
  @Index()
  declare productId: string;

  @SortableField()
  @Column()
  @Index()
  declare locationId: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index()
  declare userId: string;

  @SortableField()
  @Column()
  @Index()
  declare cafeId: string;

  // Relations
  @Field(() => InventoryProduct)
  @ManyToOne(() => InventoryProduct, (product) => product.movements)
  @JoinColumn({ name: 'productId' })
  declare product: InventoryProduct;

  @Field(() => StorageLocation)
  @ManyToOne(() => StorageLocation)
  @JoinColumn({ name: 'locationId' })
  declare location: StorageLocation;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  declare user: User;

  @Field(() => Cafe)
  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;
}

// ================================
// ANALYTICS ENTITIES
// ================================

@ObjectType('ProductAnalytics')
@Entity('product_analytics')
@Index(['productId', 'periodStart'])
@Index(['cafeId', 'periodStart'])
@Index(['totalSold', 'profitMargin'])
@Unique(['productId', 'periodStart', 'periodEnd', 'periodType'])
export class ProductAnalytics extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @SortableField()
  @Column({ type: 'date' })
  declare periodStart: Date;

  @SortableField()
  @Column({ type: 'date' })
  declare periodEnd: Date;

  @Field()
  @Column() // 'daily', 'weekly', 'monthly', 'quarterly'
  declare periodType: string;

  // Sales metrics
  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare totalSold: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare totalRevenue: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare totalCost: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare grossProfit: number;

  @Field(() => Float)
  @Column('decimal', { precision: 5, scale: 4, default: 0 })
  declare profitMargin: number;

  // Inventory metrics
  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare avgStockLevel: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare maxStockLevel: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare minStockLevel: number;

  @Field(() => Int)
  @Column({ default: 0 })
  declare stockoutsCount: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare wasteQuantity: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  declare wasteCost: number;

  // Forecasting
  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare predictedDemand: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  declare confidenceScore: number; // 0-1

  @Field(() => Float)
  @Column('decimal', { precision: 5, scale: 4, default: 1 })
  declare seasonalityFactor: number;

  @Field(() => Float)
  @Column('decimal', { precision: 5, scale: 4, default: 1 })
  declare trendFactor: number;

  @SortableField()
  @Column()
  @Index()
  declare productId: string;

  @SortableField()
  @Column()
  @Index()
  declare cafeId: string;

  // Relations
  @Field(() => InventoryProduct)
  @ManyToOne(() => InventoryProduct)
  @JoinColumn({ name: 'productId' })
  declare product: InventoryProduct;

  @Field(() => Cafe)
  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;
}

// Continue with additional entities in the next part...