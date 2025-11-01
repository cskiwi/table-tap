import { SortableField } from '@app/utils';
import { CounterType, CounterStatus } from '@app/models/enums';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  Relation,
} from 'typeorm';
import { CounterWorkingHours } from './counter-working-hours.model';
import { Cafe } from '../cafe';
import { CounterCapabilities } from './counter-capabilities.model';

@ObjectType('Counter')
@Entity('Counters')
@Index(['cafeId', 'type'])
@Index(['cafeId', 'isActive'])
export class Counter extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @SortableField({ nullable: true })
  @DeleteDateColumn({ nullable: true })
  declare deletedAt: Date;

  // Multi-tenant support
  @Field()
  @Column('uuid')
  @Index()
  declare cafeId: string;

  @ManyToOne(() => Cafe, (cafe) => cafe.counters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // Counter identification
  @Field()
  @Column()
  @IsString()
  @Index({ fulltext: true })
  declare name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare description: string;

  @Field()
  @Column('enum', { enum: CounterType })
  @IsEnum(CounterType)
  declare type: CounterType;

  @Field()
  @Column('enum', { enum: CounterStatus, default: CounterStatus.ACTIVE })
  @IsEnum(CounterStatus)
  declare status: CounterStatus;

  // Display settings
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare label: string; // Display label for orders (e.g., "K1", "B2")

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare color: string; // Hex color for UI display

  @Field()
  @Column({ default: 0 })
  @IsNumber()
  declare sortOrder: number;

  // Configuration
  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare isActive: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare autoAcceptOrders: boolean; // Automatically accept new orders

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare requiresConfirmation: boolean; // Require confirmation before marking complete

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  declare maxConcurrentOrders: number; // Maximum orders that can be processed simultaneously

  // Product categories this counter handles
  @Field({ nullable: true })
  @Column('simple-array', { nullable: true })
  declare productCategories: string[]; // ProductCategory enum values

  // Workflow settings
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  declare averagePrepTime: number; // Average preparation time in minutes

  @OneToOne(() => CounterCapabilities, capabilities => capabilities.counter, { cascade: true })
  declare capabilities: Relation<CounterCapabilities>;

  @OneToMany(() => CounterWorkingHours, hours => hours.counter, { cascade: true })
  declare workingHours: Relation<CounterWorkingHours[]>;

  // Equipment and resources
  @Field({ nullable: true })
  @Column('simple-array', { nullable: true })
  declare equipment: string[]; // List of equipment/tools available

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;

  // Performance tracking
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  declare currentLoad: number; // Current number of active orders

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastActiveAt: Date;

  // Computed fields
  @Field()
  get isAvailable(): boolean {
    return this.isActive && this.status === CounterStatus.ACTIVE;
  }

  @Field()
  get isOverloaded(): boolean {
    if (!this.maxConcurrentOrders) return false;
    return (this.currentLoad ?? 0) >= this.maxConcurrentOrders;
  }

  @Field()
  get canAcceptOrders(): boolean {
    return this.isAvailable && !this.isOverloaded;
  }

  @Field()
  get displayLabel(): string {
    return this.label || this.name;
  }

  @Field()
  get loadPercentage(): number {
    if (!this.maxConcurrentOrders) return 0;
    return Math.round(((this.currentLoad ?? 0) / this.maxConcurrentOrders) * 100);
  }
}

// GraphQL Input Types
import { InputType, PartialType, OmitType } from '@nestjs/graphql';

@InputType()
export class CounterUpdateInput extends PartialType(
  OmitType(Counter, [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'isAvailable',
    'isOverloaded',
    'canAcceptOrders',
    'displayLabel',
    'loadPercentage',
  ] as const),
  InputType
) {}

@InputType()
export class CounterCreateInput extends PartialType(
  OmitType(CounterUpdateInput, ['id'] as const),
  InputType
) {}
