import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
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
  Relation
} from 'typeorm';
import { LoyaltyAccount } from './loyalty-account.model';

@ObjectType('LoyaltyAccountBadge')
@Entity('LoyaltyAccountBadges')
@Index(['loyaltyAccountId', 'badgeId'])
export class LoyaltyAccountBadge extends BaseEntity {
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
  @Index()
  declare loyaltyAccountId: string;

  @ManyToOne(() => LoyaltyAccount, account => account.badges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loyaltyAccountId' })
  declare loyaltyAccount: Relation<LoyaltyAccount>;

  // Badge details
  @Field()
  @Column()
  @IsString()
  declare badgeId: string;

  @Field()
  @Column()
  @IsString()
  declare name: string;

  @Field()
  @Column('text')
  @IsString()
  declare description: string;

  @Field()
  @Column()
  @IsString()
  declare icon: string;

  @Field()
  @Column('timestamp')
  declare earnedAt: Date;

  @Field()
  @Column()
  @IsString()
  declare category: string;
}
