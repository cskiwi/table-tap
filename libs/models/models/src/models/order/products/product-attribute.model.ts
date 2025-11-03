import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsArray } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Product } from './product.model';

@ObjectType('ProductAttribute')
@Entity('ProductAttributes')
@Index(['productId'], { unique: true })
export class ProductAttribute extends BaseEntity {
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
  declare productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  declare product: Relation<Product>;

  // Customization options
  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare size: string[];

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare temperature: string[];

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare milkType: string[];

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare sweetness: string[];

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare extras: string[];

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare allergens: string[];

  // Nutrition info - kept as text/JSON for flexibility
  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare nutritionInfo: string; // JSON string with calories, protein, carbs, fat, etc.
}
