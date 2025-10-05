import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { ToolbarModule } from 'primeng/toolbar';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { ListboxModule } from 'primeng/listbox';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';

// Components
import { KitchenDisplayComponent } from './components/kitchen-display/kitchen-display.component';
import { OrderCardComponent } from './components/order-card/order-card.component';
import { OrderItemComponent } from './components/order-item/order-item.component';
import { TimerPanelComponent } from './components/timer-panel/timer-panel.component';
import { MetricsDashboardComponent } from './components/metrics-dashboard/metrics-dashboard.component';
import { AlertsPanelComponent } from './components/alerts-panel/alerts-panel.component';
import { SettingsPanelComponent } from './components/settings-panel/settings-panel.component';
import { TimerDialogComponent } from './components/timer-dialog/timer-dialog.component';
import { StaffAssignmentDialogComponent } from './components/staff-assignment-dialog/staff-assignment-dialog.component';
import { QualityControlDialogComponent } from './components/quality-control-dialog/quality-control-dialog.component';

// Services
import { KitchenService } from './services/kitchen.service';

const KITCHEN_COMPONENTS = [
  KitchenDisplayComponent
  OrderCardComponent
  OrderItemComponent
  TimerPanelComponent
  MetricsDashboardComponent
  AlertsPanelComponent
  SettingsPanelComponent
  TimerDialogComponent
  StaffAssignmentDialogComponent
  QualityControlDialogComponent];
const PRIMENG_MODULES = [
  CardModule,
  ButtonModule,
  ChipModule,
  MenuModule,
  BadgeModule,
  ToolbarModule,
  DividerModule,
  ProgressBarModule,
  ListboxModule,
  TabsModule,
  TooltipModule,
  DialogModule,
  ProgressSpinnerModule,
  ToggleSwitchModule,
  SelectModule,
  SliderModule,
  InputTextModule,
  CheckboxModule,
  RadioButtonModule,];
@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    ...PRIMENG_MODULES
  ],
  declarations: [;
    ...KITCHEN_COMPONENTS
  ],
  exports: [;
    ...KITCHEN_COMPONENTS
  ],
  providers: [;
    KitchenService
  ],
})
export class KitchenModule {
  /**
   * Kitchen Module - Comprehensive Restaurant Kitchen Management System
   *
   * Features:
   * - Real-time order queue management with drag-and-drop
   * - Advanced multi-timer system for cooking stages
   * - Staff assignment and workload optimization
   * - Quality control with detailed checklists
   * - Performance metrics and analytics dashboard
   * - Inventory alerts and notifications
   * - Customizable display settings for different devices
   * - Touch-friendly interface optimized for tablets
   * - Dark/light theme support with high contrast option
   * - WebSocket integration for real-time updates
   * - Kitchen equipment monitoring and maintenance tracking
   * - Workflow templates and automation
   *
   * Components:
   * - KitchenDisplayComponent: Main kitchen display with order columns
   * - OrderCardComponent: Individual order cards with full management
   * - OrderItemComponent: Detailed item preparation tracking
   * - TimerPanelComponent: Multi-timer management panel
   * - MetricsDashboardComponent: Real-time analytics and KPIs
   * - AlertsPanelComponent: Inventory and operational alerts
   * - SettingsPanelComponent: Customizable display preferences
   *
   * Dialogs:
   * - TimerDialogComponent: Create and configure cooking timers
   * - StaffAssignmentDialogComponent: Assign staff to orders with recommendations
   * - QualityControlDialogComponent: Comprehensive quality checking system
   *
   * Integration:
   * - GraphQL subscriptions for real-time order updates
   * - Backend service integration for all operations
   * - Persistent settings and preferences
   * - Sound and vibration notifications
   * - Performance tracking and optimization
   */
}