import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsObject, IsEmail, IsPhoneNumber } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany
} from 'typeorm';
import { User } from './user.model';
import { Product } from './product.model';
import { Order } from './order.model';
import { Counter } from './counter.model';
import { Employee } from './employee.model';
import { Configuration } from './configuration.model';

@ObjectType('Cafe')
@Entity('Cafes')
@Index(['name'])
@Index(['slug'])
export class Cafe extends BaseEntity {
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
  @Column({ unique: true })
  @IsString()
  @Index({ unique: true })
  declare slug: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare address: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare city: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare country: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare zipCode: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsEmail()
  @IsOptional()
  declare email: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsPhoneNumber()
  @IsOptional()
  declare phone: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare logo: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare website: string;

  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare isActive: boolean;

  @Field({ nullable: true })
  @Column('json', { nullable: true })
  @IsObject()
  @IsOptional()
  declare settings: {
    currency?: string;
    timezone?: string;
    taxRate?: number;
    serviceCharge?: number;
    enableGlassTracking?: boolean;
    enableCredits?: boolean;
    workflowSteps?: string[];
    paymentMethods?: string[];
    orderPrefix?: string;
    receiptFooter?: string;
  };

  @Field({ nullable: true })
  @Column('json', { nullable: true })
  @IsObject()
  @IsOptional()
  declare businessHours: {
    [key: string]: {
      isOpen: boolean;
      openTime?: string;
      closeTime?: string;
    };
  };

  // Relations
  @OneToMany(() => User, user => user.cafe, { cascade: true })
  declare users: User[];

  @OneToMany(() => Product, product => product.cafe, { cascade: true })
  declare products: Product[];

  @OneToMany(() => Order, order => order.cafe, { cascade: true })
  declare orders: Order[];

  @OneToMany(() => Counter, counter => counter.cafe, { cascade: true })
  declare counters: Counter[];

  @OneToMany(() => Employee, employee => employee.cafe, { cascade: true })
  declare employees: Employee[];

  @OneToMany(() => Configuration, config => config.cafe, { cascade: true })
  declare configurations: Configuration[];
}