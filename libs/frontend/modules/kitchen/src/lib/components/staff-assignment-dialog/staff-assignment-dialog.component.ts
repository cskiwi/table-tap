import { Component, Inject, inject, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
// Icon removed - use primeicons in template
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { ListboxModule } from 'primeng/listbox';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { Apollo } from 'apollo-angular';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { injectRouteData } from 'ngxtension/inject-route-data';

import { Order, Employee } from '@app/models';
import { StaffStatus } from '@app/models/enums';
import { GET_KITCHEN_STAFF } from '../../graphql/kitchen.operations';
import { AuthService } from '@app/frontend-modules-auth/service';

export interface StaffAssignmentDialogData {
  order: Order;
}

export interface StaffAssignmentDialogResult {
  staffId: string;
  reassign?: boolean;
}

interface StaffMember extends Employee {
  currentOrders: number;
  efficiency: number;
  workload: number;
  isRecommended: boolean;
  unavailableReason?: string;
}

@Component({
  selector: 'app-staff-assignment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    FloatLabelModule,
    SelectModule,
    ListboxModule,
    ChipModule,
    BadgeModule,
    DividerModule,
    ProgressBarModule,
  ],
  templateUrl: './staff-assignment-dialog.component.html',
})
export class StaffAssignmentDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly apollo = inject(Apollo);
  private readonly authService = inject(AuthService);

  // Get cafeId from route data (provided by CafeGuard)
  // CafeGuard detects the cafe from hostname and stores it in route.data
  readonly cafeId = injectRouteData<string>('cafeId');

  readonly order = input.required<Order>();
  readonly assigned = output<StaffAssignmentDialogResult>();
  readonly cancelled = output<void>();

  readonly assignmentForm: FormGroup;
  private readonly _availableStaff = signal<StaffMember[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly availableStaff = this._availableStaff.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly recommendedStaff = computed(() =>
    this.availableStaff().find(staff => staff.isRecommended)
  );

  readonly selectedStaff = computed(() => {
    const selectedId = this.assignmentForm.get('staffId')?.value;
    return this.availableStaff().find(staff => staff.id === selectedId);
  });

  constructor(
  ) {
    this.assignmentForm = this.fb.group({
      staffId: ['', Validators.required],
      reassignmentReason: [''],
    });

    // Load available staff
    this.loadAvailableStaff()
  }

  private loadAvailableStaff(): void {
    this._loading.set(true);
    this._error.set(null);

    this.apollo.watchQuery<{ kitchenStaff: any[] }>({
      query: GET_KITCHEN_STAFF,
      variables: {
        cafeId: this.cafeId(),
        status: [StaffStatus.AVAILABLE, StaffStatus.BUSY],
      },
    }).valueChanges.subscribe({
      next: (result) => {
        const staffMembers: StaffMember[] = result.data.kitchenStaff.map((staff: any, index: number) => {
          const efficiency = staff.performance?.efficiency || 0;
          const ordersCompleted = staff.performance?.ordersCompleted || 0;
          const workload = this.calculateWorkload(ordersCompleted, efficiency);

          return {
            id: staff.id,
            firstName: staff.employee.firstName,
            lastName: staff.employee.lastName,
            position: staff.employee.position,
            currentOrders: ordersCompleted,
            efficiency: efficiency * 100,
            workload: workload,
            isRecommended: index === 0 && efficiency > 0.8 && workload < 80,
            status: staff.status,
            cafeId: this.cafeId(),
            employeeId: staff.employee.id,
            hireDate: new Date(),
            isActive: true,
            displayName: `${staff.employee.firstName} ${staff.employee.lastName}`,
            fullName: `${staff.employee.firstName} ${staff.employee.lastName}`,
            canWorkToday: true,
            isClockedIn: staff.status === StaffStatus.AVAILABLE || staff.status === StaffStatus.BUSY,
            canProcessPayments: false,
            canRefundOrders: false,
            canCancelOrders: false,
            canViewReports: false,
            canManageInventory: false,
            createdAt: new Date(),
            currentShiftDuration: null,
          };
        });

        this._availableStaff.set(staffMembers);
        this._loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load kitchen staff:', error);
        this._error.set(error.message);
        this._loading.set(false);
      },
    });
  }

  private calculateWorkload(ordersCompleted: number, efficiency: number): number {
    // Simple workload calculation based on orders and efficiency
    // More orders = higher workload, higher efficiency = can handle more
    const baseWorkload = ordersCompleted * 15;
    const efficiencyFactor = 1 - (efficiency * 0.5);
    return Math.min(Math.round(baseWorkload * (1 + efficiencyFactor)), 100);
  }

  getStaffStatus(staff: StaffMember): StaffStatus {
    if (!this.isStaffAvailable(staff)) {
      return staff.status as StaffStatus;
    }

    if (staff.workload >= 90) return StaffStatus.BUSY;
    if (staff.workload <= 30) return StaffStatus.AVAILABLE;
    return StaffStatus.BUSY;
  }

  isStaffAvailable(staff: StaffMember): boolean {
    return !staff.unavailableReason &&
           staff.status !== 'break' &&
           staff.status !== 'offline';
  }

  getStaffOptionClass(staff: StaffMember): string {
    const classes = []

    if (staff.isRecommended) classes.push('recommended');
    if (!this.isStaffAvailable(staff)) classes.push('unavailable');
    if (staff.workload >= 90) classes.push('overloaded');

    return classes.join(' ');
  }

  getWorkloadColor(workload: number): string {
    if (workload >= 90) return 'warn';
    if (workload >= 70) return 'accent';
    return 'primary';
  }

  getRecommendationReason(): string {
    const recommended = this.recommendedStaff()
    if (!recommended) return '';

    if (recommended.efficiency >= 90) return 'High efficiency';
    if (recommended.workload <= 60) return 'Low workload';
    if (recommended.currentOrders <= 3) return 'Available capacity';

    return 'Best match for this order';
  }

  selectRecommended(): void {
    const recommended = this.recommendedStaff()
    if (recommended) {
      this.assignmentForm.patchValue({ staffId: recommended.id });
    }
  }

  compareStaff(staff1: string, staff2: string): boolean {
    return staff1 === staff2;
  }

  trackByStaffId(index: number, staff: StaffMember): string {
    return staff.id;
  }

  onAssign(): void {
    if (this.assignmentForm.valid) {
      const result: StaffAssignmentDialogResult = {
        staffId: this.assignmentForm.get('staffId')?.value,
        reassign: !!this.order().assignedStaff,
      };

      this.assigned.emit(result);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}