import { SortableField } from '@app/utils';
import { Field, ID, ObjectType, Float, Int } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Cafe } from './cafe.entity';
import { InventoryStatus } from '../enums/inventory-status.enum';

@ObjectType('Inventory')
@Entity('Inventory')
@Index(['cafeId', 'itemName'])
@Index(['cafeId', 'sku'], { unique: true })
export class Inventory extends BaseEntity {
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
  @Index()
  declare sku: string;

  @SortableField()
  @Column()
  @Index({ fulltext: true })
  declare itemName: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare description: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare category: string;

  @Field(() => Int)
  @Column()
  declare currentStock: number;

  @Field(() => Int)
  @Column()
  declare minimumStock: number;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  declare maximumStock: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare unitCost: number;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare unit: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare supplier: string;

  @Field(() => InventoryStatus)
  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.ACTIVE,
  })
  declare status: InventoryStatus;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare lastRestocked: Date;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare expiryDate: Date;

  @SortableField()
  @Column()
  @Index()
  declare cafeId: string;

  // Relations
  @Field(() => Cafe)
  @ManyToOne(() => Cafe, (cafe) => cafe.inventory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;

  // Computed fields
  @Field(() => Boolean)
  get isLowStock(): boolean {
    return this.currentStock <= this.minimumStock;
  }

  @Field(() => Boolean)
  get isOutOfStock(): boolean {
    return this.currentStock === 0;
  }
}