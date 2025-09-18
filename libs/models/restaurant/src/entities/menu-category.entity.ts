import { SortableField } from '@app/utils';
import { Field, ID, ObjectType, Int } from '@nestjs/graphql';
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
import { Menu } from './menu.entity';

@ObjectType('MenuCategory')
@Entity('MenuCategories')
@Index(['cafeId', 'name'])
export class MenuCategory extends BaseEntity {
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
  declare name: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare description: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare imageUrl: string;

  @Field(() => Int, { defaultValue: 0 })
  @Column({ default: 0 })
  declare sortOrder: number;

  @Field(() => Boolean, { defaultValue: true })
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

  @Field(() => [Menu], { nullable: true })
  @OneToMany(() => Menu, (menuItem) => menuItem.category)
  declare menuItems: Menu[];
}