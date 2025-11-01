import { Component, inject, computed, signal, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';

import { AdminService } from '../../services/admin.service';
import { EmployeePerformance } from '../../types/admin.types';

@Component({
  selector: 'tt-employee-management',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    CardModule,
    TagModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    DatePickerModule,
    TooltipModule,
    ProgressBarModule,
    AvatarModule,
    ChipModule,
    DividerModule
],
  templateUrl: './employee-management.component.html'
})
export class EmployeeManagementComponent implements OnInit {
  private adminService = inject(AdminService);

  // State
  loading = signal(false);
  searchTerm = '';
  selectedPosition: string | null = null;
  selectedStatus: string | null = null;
  selectedPerformance: string | null = null;

  // Real employee data from AdminService
  private allEmployees = this.adminService.employeePerformance;

  // Filter options
  positionOptions = [
    { label: 'Barista', value: 'Barista' },
  { label: 'Cashier', value: 'Cashier' },
  { label: 'Manager', value: 'Manager' },
  { label: 'Kitchen Staff', value: 'Kitchen Staff' },
  { label: 'Server', value: 'Server'
  }
  ];
  statusOptions = [
    { label: 'Clocked In', value: 'CLOCKED_IN' },
  { label: 'Clocked Out', value: 'CLOCKED_OUT' },
  { label: 'On Break', value: 'ON_BREAK'
  }
  ];
  performanceOptions = [
    { label: 'Excellent (90%+)', value: 'EXCELLENT' },
  { label: 'Good (80-89%)', value: 'GOOD' },
  { label: 'Average (70-79%)', value: 'AVERAGE' },
  { label: 'Below Average (<70%)', value: 'BELOW_AVERAGE'
  }
  ];
  // Computed values
  filteredEmployees = computed(() => {
    let employees = this.allEmployees()

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase()
      employees = employees.filter(emp =>
        emp.employeeName.toLowerCase().includes(search) ||
        emp.employeeId.toLowerCase().includes(search) ||
        emp.position.toLowerCase().includes(search)
      );
    }

    if (this.selectedPosition) {
      employees = employees.filter(emp => emp.position === this.selectedPosition);
    }

    if (this.selectedStatus) {
      employees = employees.filter(emp => emp.currentStatus === this.selectedStatus);
    }

    if (this.selectedPerformance) {
      employees = employees.filter(emp => {
        switch (this.selectedPerformance) {
          case 'EXCELLENT': return emp.efficiency >= 90;
          case 'GOOD': return emp.efficiency >= 80 && emp.efficiency < 90;
          case 'AVERAGE': return emp.efficiency >= 70 && emp.efficiency < 80;
          case 'BELOW_AVERAGE': return emp.efficiency < 70;
          default: return true;
        }
      });
    }

    return employees;
  });

  employeeMetrics = computed(() => {
    const employees = this.allEmployees()
    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(emp => emp.currentStatus !== 'INACTIVE').length,
      clockedIn: employees.filter(emp => emp.currentStatus === 'CLOCKED_IN').length,
      avgPerformance: Math.round(employees.reduce((sum, emp) => sum + emp.efficiency, 0) / employees.length),
      totalHours: employees.reduce((sum, emp) => sum + emp.hoursWorked, 0)
    }
  });

  ngOnInit(): void {
    this.loadEmployees()
  }

  loadEmployees(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
    }, 1000);
  }

  refreshData(): void {
    this.loadEmployees()
  }

  applyFilters(): void {
    // Filters are applied automatically via computed
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedPosition = null;
    this.selectedStatus = null;
    this.selectedPerformance = null;
  }

  addEmployee(): void {
    // Navigate to add employee form
  }

  viewEmployee(employee: EmployeePerformance): void {
    // Open employee details modal
  }

  editEmployee(employee: EmployeePerformance): void {
    // Open edit employee modal
  }

  manageSchedule(employee: EmployeePerformance): void {
    // Open schedule management modal
  }

  clockIn(employee: EmployeePerformance): void {
    // In production, this would call a GraphQL mutation
    // For now, we just log the action
    console.log(`Clocking in employee: ${employee.employeeName}`);
    // TODO: Implement GraphQL mutation for clock in/out
  }

  clockOut(employee: EmployeePerformance): void {
    // In production, this would call a GraphQL mutation
    // For now, we just log the action
    console.log(`Clocking out employee: ${employee.employeeName}`);
    // TODO: Implement GraphQL mutation for clock in/out
  }

  exportEmployees(): void {
    // Export employee data
  }

  // Utility methods
  getStatusSeverity(status: string): "info" | "success" | "warn" | "secondary" | "contrast" | "danger" {
    switch (status) {
      case 'CLOCKED_IN': return 'success';
      case 'ON_BREAK': return 'warn';
      case 'CLOCKED_OUT': return 'secondary';
      case 'INACTIVE': return 'danger';
      default: return 'secondary';
    }
  }

  getPerformanceSeverity(efficiency: number): "info" | "success" | "warn" | "secondary" | "contrast" | "danger" {
    if (efficiency >= 90) return 'success';
    if (efficiency >= 80) return 'info';
    if (efficiency >= 70) return 'warn';
    return 'danger';
  }

  getShiftDuration(employee: EmployeePerformance): string {
    // Mock implementation - would calculate actual shift duration
    return `${Math.floor(employee.hoursWorked)}h ${Math.round((employee.hoursWorked % 1) * 60)}m`;
  }
}
