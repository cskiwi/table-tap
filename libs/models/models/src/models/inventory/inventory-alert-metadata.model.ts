import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Relation
} from 'typeorm';
import { InventoryAlert } from './inventory-alert.model';

@ObjectType('InventoryAlertMetadata')
@Entity('InventoryAlertMetadata')
@Index(['alertId'], { unique: true })
export class InventoryAlertMetadata extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  // Relations
  @Field()
  @Column('uuid')
  declare alertId: string;

  @OneToOne(() => InventoryAlert, alert => alert.metadata, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'alertId' })
  declare alert: Relation<InventoryAlert>;

  // Metadata fields
  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare previousQuantity: number;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare expectedRestock: Date;

  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare autoReorderTriggered: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare supplierNotified: boolean;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare estimatedOutOfStockDate: Date;
}
