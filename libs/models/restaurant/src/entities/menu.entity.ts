import { SortableField } from '@app/utils';
import { Field, ID, ObjectType, Int, Float } from '@nestjs/graphql';
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
} from 'typeorm';
import { Cafe } from './cafe.entity';
import { MenuCategory } from './menu-category.entity';
import { OrderItem } from './order-item.entity';
import { MenuItemStatus } from '../enums/menu-item-status.enum';

@ObjectType('Menu')
@Entity('Menus')
@Index(['cafeId', 'name'])
export class Menu extends BaseEntity {
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

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index({ fulltext: true })
  declare description: string;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  @Index()
  declare price: number;

  @Field(() => MenuItemStatus)
  @Column({
    type: 'enum',
    enum: MenuItemStatus,
    default: MenuItemStatus.AVAILABLE,
  })
  declare status: MenuItemStatus;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  declare preparationTime: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare imageUrl: string;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare nutritionalInfo: Record<string, any>;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare allergens: string[];

  @Field(() => Int, { defaultValue: 0 })
  @Column({ default: 0 })
  declare sortOrder: number;

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
  @ManyToOne(() => Cafe, (cafe) => cafe.menus, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;

  @Field(() => MenuCategory, { nullable: true })
  @ManyToOne(() => MenuCategory, (category) => category.menuItems, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  declare category: MenuCategory;

  @Field(() => [OrderItem], { nullable: true })
  @OneToMany(() => OrderItem, (orderItem) => orderItem.menuItem)
  declare orderItems: OrderItem[];
}