import { SortableField } from '@app/utils';
import { Field, ID, ObjectType, Float, Int } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { MetricType } from '../enums/metric-type.enum';
import { MetricCategory } from '../enums/metric-category.enum';

@ObjectType('PerformanceMetric')
@Entity('PerformanceMetrics')
@Index(['employeeId', 'metricType', 'period'])
@Index(['cafeId', 'metricType', 'recordedAt'])
@Index(['period', 'metricType'])
export class PerformanceMetric extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @Field(() => MetricType)
  @Column({
    type: 'enum',
    enum: MetricType,
  })
  @Index()
  declare metricType: MetricType;

  @Field(() => MetricCategory)
  @Column({
    type: 'enum',
    enum: MetricCategory,
  })
  declare category: MetricCategory;

  @Field(() => Float)
  @Column('decimal', { precision: 15, scale: 4 })
  declare value: number;

  @Field()
  @Column()
  declare unit: string; // e.g., 'seconds', 'count', 'percentage', 'dollars'

  @Field()
  @Column()
  @Index()
  declare period: string; // YYYY-MM-DD or YYYY-MM for daily/monthly aggregation

  @SortableField()
  @Column()
  @Index()
  declare recordedAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare contextData: {
    shiftId?: string;
    orderId?: string;
    customerId?: string;
    orderValue?: number;
    itemCount?: number;
    complexity?: 'low' | 'medium' | 'high';
    peakHours?: boolean;
    weatherCondition?: string;
    dayOfWeek?: number;
    holidayPeriod?: boolean;
    staffingLevel?: 'understaffed' | 'normal' | 'overstaffed';
  };

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare comparativeData: {
    previousPeriodValue?: number;
    cafeAverage?: number;
    companyAverage?: number;
    industryBenchmark?: number;
    goalValue?: number;
    targetValue?: number;
  };

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare score: number; // Normalized score (0-100)

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare grade: string; // A, B, C, D, F or custom grading

  @Field(() => Boolean, { defaultValue: false })
  @Column({ default: false })
  declare isAggregated: boolean; // True for rolled-up metrics

  @Field(() => Boolean, { defaultValue: false })
  @Column({ default: false })
  declare isGoalMet: boolean;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  declare notes: string;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare metadata: {
    dataSource?: string;
    calculationMethod?: string;
    confidence?: number;
    outlier?: boolean;
    validated?: boolean;
    impactLevel?: 'low' | 'medium' | 'high';
  };

  @SortableField()
  @Column()
  @Index()
  declare employeeId: string;

  @SortableField()
  @Column()
  @Index()
  declare cafeId: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index()
  declare recordedBy: string; // System or manager who recorded this metric

  // Relations
  @Field(() => Employee)
  @ManyToOne(() => Employee, (employee) => employee.performanceMetrics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  // Computed fields
  @Field(() => Float, { nullable: true })
  get improvementPercentage(): number {
    if (!this.comparativeData?.previousPeriodValue) return null;
    const previous = this.comparativeData.previousPeriodValue;
    return Number((((this.value - previous) / previous) * 100).toFixed(2));
  }

  @Field(() => Boolean)
  get isImprovement(): boolean {
    if (!this.comparativeData?.previousPeriodValue) return false;

    // For metrics where higher is better (e.g., sales, efficiency)
    const higherIsBetter = [
      MetricType.SALES_PER_HOUR,
      MetricType.CUSTOMER_SATISFACTION,
      MetricType.ACCURACY_RATE,
      MetricType.UPSELL_SUCCESS_RATE,
    ].includes(this.metricType);

    const change = this.value - this.comparativeData.previousPeriodValue;
    return higherIsBetter ? change > 0 : change < 0;
  }

  @Field(() => String, { nullable: true })
  get performanceLevel(): string {
    if (!this.score) return null;

    if (this.score >= 90) return 'Excellent';
    if (this.score >= 80) return 'Good';
    if (this.score >= 70) return 'Satisfactory';
    if (this.score >= 60) return 'Needs Improvement';
    return 'Poor';
  }

  @Field(() => Boolean)
  get isAboveAverage(): boolean {
    return this.comparativeData?.cafeAverage && this.value > this.comparativeData.cafeAverage;
  }

  @Field(() => Boolean)
  get isOutlier(): boolean {
    return this.metadata?.outlier === true;
  }

  @Field(() => String)
  get displayValue(): string {
    switch (this.unit) {
      case 'seconds':
        if (this.value < 60) return `${this.value}s`;
        return `${Math.floor(this.value / 60)}m ${Math.floor(this.value % 60)}s`;
      case 'percentage':
        return `${this.value.toFixed(1)}%`;
      case 'dollars':
        return `$${this.value.toFixed(2)}`;
      case 'count':
        return Math.floor(this.value).toString();
      default:
        return this.value.toString();
    }
  }

  @Field(() => Float, { nullable: true })
  get goalProgress(): number {
    if (!this.comparativeData?.goalValue) return null;
    return Number(((this.value / this.comparativeData.goalValue) * 100).toFixed(2));
  }

  // Static methods for metric definitions
  static readonly METRIC_DEFINITIONS = {
    [MetricType.ORDER_PROCESSING_TIME]: {
      unit: 'seconds',
      category: MetricCategory.EFFICIENCY,
      lowerIsBetter: true,
      description: 'Average time to process a customer order'
    },
    [MetricType.SALES_PER_HOUR]: {
      unit: 'dollars',
      category: MetricCategory.PRODUCTIVITY,
      lowerIsBetter: false,
      description: 'Revenue generated per hour worked'
    },
    [MetricType.CUSTOMER_SATISFACTION]: {
      unit: 'percentage',
      category: MetricCategory.QUALITY,
      lowerIsBetter: false,
      description: 'Customer satisfaction rating'
    },
    [MetricType.ACCURACY_RATE]: {
      unit: 'percentage',
      category: MetricCategory.QUALITY,
      lowerIsBetter: false,
      description: 'Order accuracy rate'
    },
    [MetricType.UPSELL_SUCCESS_RATE]: {
      unit: 'percentage',
      category: MetricCategory.SALES,
      lowerIsBetter: false,
      description: 'Success rate of upselling attempts'
    },
    [MetricType.PUNCTUALITY_SCORE]: {
      unit: 'percentage',
      category: MetricCategory.ATTENDANCE,
      lowerIsBetter: false,
      description: 'On-time arrival score'
    },
    [MetricType.TRAINING_COMPLETION]: {
      unit: 'percentage',
      category: MetricCategory.DEVELOPMENT,
      lowerIsBetter: false,
      description: 'Training program completion rate'
    }
  };
}