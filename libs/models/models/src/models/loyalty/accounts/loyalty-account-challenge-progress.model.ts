import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsOptional } from 'class-validator';
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

@ObjectType('LoyaltyAccountChallengeProgress')
@Entity('LoyaltyAccountChallengeProgresses')
@Index(['loyaltyAccountId', 'challengeId'])
export class LoyaltyAccountChallengeProgress extends BaseEntity {
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

  @ManyToOne(() => LoyaltyAccount, account => account.challengeProgresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loyaltyAccountId' })
  declare loyaltyAccount: Relation<LoyaltyAccount>;

  // Challenge tracking
  @Field()
  @Column('uuid')
  @Index()
  declare challengeId: string;

  @Field()
  @Column('int')
  @IsNumber()
  declare progress: number;

  @Field()
  @Column('int')
  @IsNumber()
  declare target: number;

  @Field()
  @Column('timestamp')
  declare startedAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  @IsOptional()
  declare completedAt: Date;
}
