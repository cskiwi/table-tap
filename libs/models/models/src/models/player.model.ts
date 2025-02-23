import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@ObjectType('Player')
@Entity('Players')
@Index(['firstName', 'lastName'])
export class Player extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @Index({ unique: true })
  @Column({ unique: true })
  declare sub: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index({ fulltext: true })
  declare firstName: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index({ fulltext: true })
  declare lastName: string;

  @Index({ unique: true })
  @SortableField()
  @Column()
  declare slug: string;

  @SortableField()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
