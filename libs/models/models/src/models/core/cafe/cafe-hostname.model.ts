import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsString } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Cafe } from './cafe.model';

/**
 * CafeHostname entity for storing multiple hostnames/domains per cafe.
 * This enables multi-domain support where a single cafe can be accessed
 * via different hostnames (e.g., cafe-name.tabletap.com, custom-domain.com).
 *
 * @example
 * ```typescript
 * // Examples:
 * { hostname: 'my-cafe.tabletap.com', isPrimary: true, cafeId: 'cafe-123' }
 * { hostname: 'mycafe.com', isPrimary: false, cafeId: 'cafe-123' }
 * { hostname: 'localhost:4200', isPrimary: false, cafeId: 'cafe-123' } // For development
 * ```
 */
@ObjectType('CafeHostname')
@Entity('CafeHostnames')
export class CafeHostname extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Field()
  @CreateDateColumn()
  declare createdAt: Date;

  @Field({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @Field()
  @Column({ unique: true })
  @IsString()
  @Index({ unique: true })
  declare hostname: string;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare isPrimary: boolean;

  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare isActive: boolean;

  // Relations
  @Field(() => String)
  @Column()
  declare cafeId: string;

  @ManyToOne(() => Cafe, (cafe) => cafe.hostnames, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;
}
