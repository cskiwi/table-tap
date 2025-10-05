import { Component, Inject, inject, signal, computed } from '@angular/core';
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
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { KitchenOrder, StaffStatus } from '../../types/kitchen.types';
import { Employee } from '@app/models';

export interface StaffAssignmentDialogData {
  order: KitchenOrder;
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

  readonly assignmentForm: FormGroup;
  private readonly _availableStaff = signal<StaffMember[]>([]);

  readonly availableStaff = this._availableStaff.asReadonly()

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
    // Mock data - in real implementation, this would come from a service
    const mockStaff: StaffMember[] = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        position: 'chef',
        currentOrders: 3,
        efficiency: 92,
        workload: 75,
        isRecommended: true,
        status: 'available' as any;
        cafeId: '',
        employeeId: 'EMP001',
        hireDate: new Date()
        isActive: true,
        displayName: 'John Smith',
        fullName: 'John Smith',
        canWorkToday: true,
        isClockedIn: true,
        canProcessPayments: false,
        canRefundOrders: false,
        canCancelOrders: false,
        canViewReports: false,
        canManageInventory: false,
        createdAt: new Date()
        currentShiftDuration: null,
      }
      {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        position: 'sous_chef',
        currentOrders: 5,
        efficiency: 88,
        workload: 90,
        isRecommended: false,
        status: 'busy' as any;
        cafeId: '',
        employeeId: 'EMP002',
        hireDate: new Date()
        isActive: true,
        displayName: 'Sarah Johnson',
        fullName: 'Sarah Johnson',
        canWorkToday: true,
        isClockedIn: true,
        canProcessPayments: false,
        canRefundOrders: false,
        canCancelOrders: false,
        canViewReports: false,
        canManageInventory: false,
        createdAt: new Date()
        currentShiftDuration: null,
      }
      {
        id: '3',
        firstName: 'Mike',
        lastName: 'Wilson',
        position: 'prep_cook',
        currentOrders: 2,
        efficiency: 85,
        workload: 60,
        isRecommended: false,
        status: 'available' as any;
        cafeId: '',
        employeeId: 'EMP003',
        hireDate: new Date()
        isActive: true,
        displayName: 'Mike Wilson',
        fullName: 'Mike Wilson',
        canWorkToday: true,
        isClockedIn: true,
        canProcessPayments: false,
        canRefundOrders: false,
        canCancelOrders: false,
        canViewReports: false,
        canManageInventory: false,
        createdAt: new Date()
        currentShiftDuration: null,
      }
      {
        id: '4',
        firstName: 'Lisa',
        lastName: 'Brown',
        position: 'line_cook',
        currentOrders: 0,
        efficiency: 0,
        workload: 0,
        isRecommended: false,
        unavailableReason: 'On break until 3:30 PM',
        status: 'break' as any;
        cafeId: '',
        employeeId: 'EMP004',
        hireDate: new Date()
        isActive: true,
        displayName: 'Lisa Brown',
        fullName: 'Lisa Brown',
        canWorkToday: true,
        isClockedIn: true,
        canProcessPayments: false,
        canRefundOrders: false,
        canCancelOrders: false,
        canViewReports: false,
        canManageInventory: false,
        createdAt: new Date()
        currentShiftDuration: null,
  }
  ];
    this._availableStaff.set(mockStaff);
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
        staffId: this.assignmentForm.get('staffId')?.value;
        reassign: !!this.data.order.assignedStaff;
      }

      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close()
  }
}