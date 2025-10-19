import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('supplier_info')
export class SupplierInfo {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column('varchar', { length: 255 })
  declare name: string;

  @Column('jsonb', { nullable: true })
  declare contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };

  @Column('integer')
  declare leadTime: number; // days

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare minimumOrderValue?: number;

  @Column('simple-array')
  declare items: string[]; // inventory item IDs

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  declare performanceRating?: number;

  @Column('timestamp', { nullable: true })
  declare lastOrderDate?: Date;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
